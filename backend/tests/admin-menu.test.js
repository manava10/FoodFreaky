const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
// Keep database mutations real; inject an authenticated identity for route tests.
auth.protect = (req, res, next) => {
    if (!req.headers['x-test-role']) return res.sendStatus(401);
    req.user = { id: 'test-admin', role: req.headers['x-test-role'] };
    next();
};
const router = require('../routes/admin');
let server, base, restaurant;
before(async () => {
    if (!process.env.TEST_MONGO_URI) throw new Error('Use npm run test:integration to start an isolated database');
    await mongoose.connect(process.env.TEST_MONGO_URI, {
        dbName: `foodfreaky_menu_test_${process.pid}`, serverSelectionTimeoutMS: 3000,
    });
    const app = express();
    app.use(express.json());
    app.use('/api/admin', router);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}/api/admin`;
    restaurant = await Restaurant.create({
        name: 'Test restaurant', cuisine: 'Test', deliveryTime: '20 min',
        menu: [{ category: 'Meals', items: [{ name: 'Rice', price: 50 }, { name: 'Dal', price: 60 }] },
            { category: 'Drinks', items: [{ name: 'Tea', price: 10 }] }],
    });
});
after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
const request = (path, method, body, role = 'admin') => fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(role ? { 'x-test-role': role } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
});
test('menu routes validate, persist edits, preserve concurrent changes and enforce admin access', async () => {
    const path = `/restaurants/${restaurant.id}/menu`;
    const rice = restaurant.menu[0].items[0].id;
    const dal = restaurant.menu[0].items[1].id;
    const tea = restaurant.menu[1].items[0].id;
    assert.equal((await request(`${path}/${rice}`, 'PUT', { price: -1 })).status, 400);
    assert.equal((await request(`${path}/${rice}`, 'PUT', {})).status, 400);
    assert.equal((await request(`${path}/invalid`, 'DELETE')).status, 400);
    assert.equal((await request(`${path}/${rice}`, 'DELETE', null, 'user')).status, 403);
    assert.equal((await request(`${path}/${rice}`, 'DELETE', null, 'deliveryadmin')).status, 403);
    assert.equal((await request(`${path}/${rice}`, 'DELETE', null, null)).status, 401);
    let response = await request(`${path}/${rice}`, 'PUT', { price: '75', description: 'Fresh rice', emoji: '🍚', _id: dal });
    assert.equal(response.status, 200);
    let data = (await response.json()).data;
    assert.equal(data.menu[0].items[0].description, 'Fresh rice');
    assert.equal(data.menu[0].items[0].price, 75);
    assert.equal(data.menu[0].items[0]._id, rice);
    const results = await Promise.all([
        request(`${path}/${rice}`, 'PUT', { price: 80 }),
        request(`${path}/${dal}`, 'DELETE'),
    ]);
    assert.deepEqual(results.map(result => result.status), [200, 200]);
    let saved = await Restaurant.findById(restaurant.id).lean();
    assert.equal(saved.menu[0].items.length, 1);
    assert.equal(saved.menu[0].items[0].price, 80);
    assert.equal((await request(`${path}/${tea}`, 'DELETE')).status, 200);
    saved = await Restaurant.findById(restaurant.id).lean();
    assert.equal(saved.menu.length, 1);
    assert.equal((await request(`${path}/${tea}`, 'DELETE')).status, 404);
    assert.equal((await request(path, 'POST', { category: 'Meals', name: 'Soup', price: 20, description: 'Hot soup' })).status, 201);
    saved = await Restaurant.findById(restaurant.id).lean();
    assert.equal(saved.menu[0].items[1].description, 'Hot soup');
});

test('simultaneous additions create one category and preserve both menu items', async t => {
    const empty = await Restaurant.create({ name: 'Concurrent additions', cuisine: 'Test', deliveryTime: '20 min', menu: [] });
    // Force the legacy read/save implementation to observe the same empty menu.
    // An atomic implementation bypasses this read barrier entirely.
    const originalLookup = Restaurant.findById;
    let reads = 0, release;
    const ready = new Promise(resolve => { release = resolve; });
    const lookup = t.mock.method(Restaurant, 'findById', async function (...args) {
        const document = await originalLookup.apply(this, args);
        if (++reads === 2) release();
        await ready;
        return document;
    });
    const path = `/restaurants/${empty.id}/menu`;
    const results = await Promise.all([
        request(path, 'POST', { category: 'New category', name: 'Rice', price: 50 }),
        request(path, 'POST', { category: 'New category', name: 'Dal', price: 60 }),
    ]);
    lookup.mock.restore();
    assert.deepEqual(results.map(result => result.status), [201, 201]);
    const saved = await Restaurant.findById(empty.id).lean();
    assert.equal(saved.menu.length, 1, 'category must not be duplicated');
    assert.deepEqual(saved.menu[0].items.map(item => item.name).sort(), ['Dal', 'Rice']);
});

test('adding while deleting the last category item preserves the intended category', async () => {
    const target = await Restaurant.create({
        name: 'Concurrent add and delete', cuisine: 'Test', deliveryTime: '20 min',
        menu: [{ category: 'Target', items: [{ name: 'Old', price: 10 }] },
            { category: 'Other', items: [{ name: 'Untouched', price: 20 }] }],
    });
    const path = `/restaurants/${target.id}/menu`;
    const results = await Promise.all([
        request(path, 'POST', { category: 'Target', name: 'New', price: 30 }),
        request(`${path}/${target.menu[0].items[0].id}`, 'DELETE'),
    ]);
    assert.deepEqual(results.map(result => result.status), [201, 200]);
    const saved = await Restaurant.findById(target.id).lean();
    assert.equal(saved.menu.length, 2);
    assert.deepEqual(saved.menu.find(category => category.category === 'Target').items.map(item => item.name), ['New']);
    assert.deepEqual(saved.menu.find(category => category.category === 'Other').items.map(item => item.name), ['Untouched']);
});
