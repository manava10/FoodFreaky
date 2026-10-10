// Isolated integration runner: requires mongod on PATH, never reads app .env.
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { MongoClient } = require('mongoose').mongo;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const freePort = () => new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        server.close(() => resolve(port));
    });
});

(async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'foodfreaky-integration-'));
    let mongod, client;
    try {
        const port = await freePort();
        const replica = 'foodfreaky-test';
        mongod = spawn('mongod', [
            '--dbpath', directory, '--bind_ip', '127.0.0.1', '--port', String(port),
            '--replSet', replica, '--logpath', path.join(directory, 'mongod.log'),
        ], { stdio: 'ignore' });
        let startupError;
        mongod.on('error', error => { startupError = error; });
        client = new MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`, { serverSelectionTimeoutMS: 500 });
        const deadline = Date.now() + 30000;
        while (true) {
            if (startupError) throw startupError;
            if (mongod.exitCode !== null) throw new Error(`Test mongod exited: ${mongod.exitCode}`);
            try { await client.connect(); break; }
            catch (error) { if (Date.now() > deadline) throw error; await delay(100); }
        }
        await client.db('admin').command({ replSetInitiate: {
            _id: replica, members: [{ _id: 0, host: `127.0.0.1:${port}` }],
        } });
        while (!(await client.db('admin').command({ hello: 1 })).isWritablePrimary) {
            if (Date.now() > deadline) throw new Error('Test replica set did not become ready');
            await delay(100);
        }
        console.log('Temporary MongoDB replica set ready; running integration tests.');
        const tests = spawn(process.execPath, ['--test', 'tests/admin-menu.test.js', 'tests/order-lifecycle.test.js', 'tests/traffic.test.js'], {
            cwd: path.resolve(__dirname, '..'), stdio: 'inherit',
            env: { ...process.env, TEST_MONGO_URI: `mongodb://127.0.0.1:${port}/?replicaSet=${replica}` },
        });
        const code = await new Promise((resolve, reject) => {
            tests.on('error', reject);
            tests.on('exit', (status, signal) => resolve(signal ? 1 : status));
        });
        process.exitCode = code;
    } catch (error) {
        console.error('Integration test runner failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (client) await client.close();
        if (mongod?.pid && mongod.exitCode === null && mongod.signalCode === null) {
            const stopped = new Promise(resolve => mongod.once('exit', resolve));
            mongod.kill('SIGTERM');
            await stopped;
        }
        await rm(directory, { recursive: true, force: true });
    }
})();
