const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SiteVisit = require('../models/SiteVisit');
process.env.JWT_SECRET = 'isolated-traffic-test-secret';
let server, base, tokens;
before(async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: `foodfreaky_traffic_test_${process.pid}` });
    await SiteVisit.init();
    tokens = {};
    for (const role of ['admin', 'deliveryadmin', 'user']) {
        const user = await User.create({ name: role, email: `${role}@example.com`, password: 'TestPassword123!', contactNumber: `999999999${Object.keys(tokens).length}`, role });
        tokens[role] = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    }
    const app = express();
    app.use(express.json());
    app.use('/api/traffic', require('../routes/traffic'));
    app.use('/api/admin', require('../routes/admin'));
    app.use((error, req, res, next) => res.status(500).json({ msg: error.message }));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
const request = (path, role, body) => fetch(`${base}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: `Bearer ${tokens[role]}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
});
test('traffic totals are accessible only to superadmins', async () => {
    for (const [role, status] of [[null, 401], ['user', 403], ['deliveryadmin', 403], ['admin', 200]]) {
        assert.equal((await request('/api/admin/traffic', role)).status, status);
    }
    const response = await request('/api/admin/traffic', 'admin');
    assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('heartbeat validates IDs, excludes staff, and deduplicates concurrent visits', async () => {
    assert.equal((await request('/api/traffic/heartbeat', null, { sessionId: 'bad' })).status, 400);
    for (const role of ['admin', 'deliveryadmin']) {
        assert.equal((await request('/api/traffic/heartbeat', role, { sessionId: 'b'.repeat(32) })).status, 204);
    }
    assert.equal(await SiteVisit.countDocuments(), 0);
    const results = await Promise.all(Array.from({ length: 10 }, () => request('/api/traffic/heartbeat', null, { sessionId: 'a'.repeat(32) })));
    assert.ok(results.every(response => response.status === 204));
    assert.equal((await request('/api/traffic/heartbeat', 'user', { sessionId: 'c'.repeat(32) })).status, 204);
    const data = (await (await request('/api/admin/traffic', 'admin')).json()).data;
    assert.equal(data.totalVisits, 2);
    assert.equal(data.onlineVisitors, 2);
    assert.ok(data.trackingSince);
});
test('expired presence keeps cumulative visits and returning heartbeats restore presence', async () => {
    await SiteVisit.updateMany({}, { $set: { lastSeen: new Date(Date.now() - 121000) } });
    let data = (await (await request('/api/admin/traffic', 'admin')).json()).data;
    assert.equal(data.onlineVisitors, 0);
    assert.equal(data.totalVisits, 2);
    await request('/api/traffic/heartbeat', null, { sessionId: 'a'.repeat(32) });
    data = (await (await request('/api/admin/traffic', 'admin')).json()).data;
    assert.equal(data.onlineVisitors, 1);
    assert.equal(data.totalVisits, 2);
});
