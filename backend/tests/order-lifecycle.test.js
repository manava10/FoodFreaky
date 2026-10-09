const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Coupon = require('../models/Coupon');
const Setting = require('../models/Setting');
const logger = require('../utils/logger');
const sentEmails = [];
// Only SMTP is stubbed. JWT, authorization, DB transactions and HTTP are real.
require('../utils/sendEmail');
require.cache[require.resolve('../utils/sendEmail')].exports = async options => { sentEmails.push(options); };
process.env.JWT_SECRET = 'local-integration-test-secret-only';
const adminRouter = require('../routes/admin');
const ordersRouter = require('../routes/orders');
let server, base, admin;

before(async () => {
    if (!process.env.TEST_MONGO_URI) throw new Error('Use npm run test:integration to start an isolated database');
    await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: `foodfreaky_orders_test_${process.pid}` });
    await Promise.all([Order.init(), User.init(), Restaurant.init(), Coupon.init(), Setting.init()]);
    logger.transports.forEach(transport => { transport.silent = true; });
    admin = await makeUser(0, 'admin');
    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);
    app.use('/api/orders', ordersRouter);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
const makeUser = (credits = 50, role = 'user') => User.create({
    name: 'Local Test', email: `${crypto.randomUUID()}@gmail.com`, googleId: crypto.randomUUID(),
    contactNumber: '1234567890', isVerified: true, credits, role,
});
const fixture = async (credits = 50) => {
    const user = await makeUser(credits);
    const restaurant = await Restaurant.create({
        name: crypto.randomUUID(), cuisine: 'Test', deliveryTime: '20 min',
        menu: [{ category: 'Meals', items: [{ name: 'Rice', price: 1000 }] }],
    });
    const body = {
        restaurant: restaurant.id, items: [{ name: 'Rice', quantity: 1 }],
        shippingAddress: 'Test delivery address', creditsUsed: 50,
        checkoutKey: crypto.randomUUID(),
    };
    return { user, restaurant, body };
};
const request = async (user, endpoint, method, body) => {
    const response = await fetch(`${base}${endpoint}`, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ id: user.id }, process.env.JWT_SECRET)}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
};
const checkout = (user, body) => request(user, '/orders', 'POST', body);
const status = (id, value) => request(admin, `/admin/orders/${id}`, 'PUT', { status: value });
const cancel = (user, id) => request(user, `/orders/${id}/cancel`, 'PUT');
const balance = async user => (await User.findById(user.id)).credits;

test('concurrent identical checkout creates one order and debits/reserves only once', async () => {
    const { user, body } = await fixture();
    const coupon = await Coupon.create({ code: crypto.randomUUID(), discountType: 'fixed', value: 10, usageLimit: 10 });
    body.couponUsed = coupon.code;
    const responses = await Promise.all([checkout(user, body), checkout(user, body), checkout(user, body)]);
    assert.ok(responses.every(result => [200, 201].includes(result.status)), JSON.stringify(responses));
    assert.equal(new Set(responses.map(result => result.body._id)).size, 1);
    assert.equal(await Order.countDocuments({ user: user.id }), 1);
    assert.equal(await balance(user), 0);
    assert.equal((await Coupon.findById(coupon.id)).timesUsed, 1);
    assert.equal(responses[0].body.checkoutFingerprint, undefined);
});

test('different concurrent checkouts cannot overspend a balance', async () => {
    const { user, body } = await fixture();
    const responses = await Promise.all([checkout(user, body), checkout(user, { ...body, checkoutKey: crypto.randomUUID() })]);
    assert.deepEqual(responses.map(result => result.status), [201, 201]);
    assert.deepEqual(responses.map(result => result.body.creditsUsed).sort((a, b) => a - b), [0, 50]);
    assert.equal(await balance(user), 0);
});

test('coupon final use is reserved by only one of two simultaneous orders', async () => {
    const first = await fixture();
    const second = await makeUser();
    const coupon = await Coupon.create({ code: crypto.randomUUID(), discountType: 'fixed', value: 10, usageLimit: 1 });
    const body = { ...first.body, couponUsed: coupon.code };
    const responses = await Promise.all([checkout(first.user, body), checkout(second, { ...body, checkoutKey: crypto.randomUUID() })]);
    assert.deepEqual(responses.map(result => result.status).sort(), [201, 400]);
    assert.equal(await Order.countDocuments({ couponUsed: coupon.code }), 1);
    assert.equal((await Coupon.findById(coupon.id)).timesUsed, 1);
    assert.equal(await balance(first.user) + await balance(second), 50);
});

test('checkout rollback restores order, balance and coupon after a reservation failure', async t => {
    const { user, body } = await fixture();
    const coupon = await Coupon.create({ code: crypto.randomUUID(), discountType: 'fixed', value: 10 });
    body.couponUsed = coupon.code;
    const injected = t.mock.method(Coupon, 'updateOne', async () => { throw new Error('Injected reservation failure'); });
    assert.equal((await checkout(user, body)).status, 500);
    injected.mock.restore();
    assert.equal(await Order.countDocuments({ user: user.id }), 0);
    assert.equal(await balance(user), 50);
    assert.equal((await Coupon.findById(coupon.id)).timesUsed, 0);
    assert.equal((await checkout(user, body)).status, 201);
});

test('reused key with different inputs is rejected; keys are scoped to the user', async () => {
    const { user, body } = await fixture();
    assert.equal((await checkout(user, body)).status, 201);
    assert.equal((await checkout(user, { ...body, shippingAddress: 'Different delivery address' })).status, 409);
    assert.equal(await Order.countDocuments({ user: user.id }), 1);
    const other = await makeUser();
    assert.equal((await checkout(other, body)).status, 201);
});

test('lost-response retry returns the committed order even after store closure', async () => {
    const { user, body } = await fixture();
    const first = await checkout(user, body);
    await Setting.create({ key: 'appSettings', isOrderingEnabled: false });
    try {
        const retry = await checkout(user, body);
        assert.equal(retry.status, 200);
        assert.equal(retry.body._id, first.body._id);
        assert.equal((await checkout(user, { ...body, checkoutKey: crypto.randomUUID() })).status, 400);
    } finally { await Setting.deleteMany({}); }
});

test('concurrent deliveries reward once and send one email', async () => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    const beforeEmails = sentEmails.length;
    const responses = await Promise.all([status(order._id, 'Delivered'), status(order._id, 'Delivered')]);
    assert.deepEqual(responses.map(result => result.status), [200, 200]);
    assert.equal(await balance(user), Math.floor(order.totalPrice * 0.02));
    assert.equal((await Order.findById(order._id)).creditsEarned, Math.floor(order.totalPrice * 0.02));
    assert.equal(sentEmails.length - beforeEmails, 1);
    assert.equal((await cancel(user, order._id)).status, 409);
    assert.equal((await status(order._id, 'Preparing Food')).status, 409);
});

test('failed delivery credit write rolls back status and reward, then retries once', async t => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    const injected = t.mock.method(User, 'updateOne', async () => { throw new Error('Injected reward failure'); });
    assert.equal((await status(order._id, 'Delivered')).status, 500);
    injected.mock.restore();
    assert.equal((await Order.findById(order._id)).status, 'Waiting for Acceptance');
    assert.equal((await Order.findById(order._id)).creditsEarned, 0);
    assert.equal(await balance(user), 0);
    assert.equal((await status(order._id, 'Delivered')).status, 200);
    assert.equal(await balance(user), Math.floor(order.totalPrice * 0.02));
});

test('concurrent customer cancellation refunds once and retains coupon usage', async () => {
    const { user, body } = await fixture();
    const coupon = await Coupon.create({ code: crypto.randomUUID(), discountType: 'fixed', value: 10 });
    body.couponUsed = coupon.code;
    const order = (await checkout(user, body)).body;
    const responses = await Promise.all([cancel(user, order._id), cancel(user, order._id)]);
    assert.deepEqual(responses.map(result => result.status), [200, 200]);
    assert.equal(await balance(user), 50);
    assert.equal((await Order.findById(order._id)).creditsRefunded, 50);
    assert.equal((await Coupon.findById(coupon.id)).timesUsed, 1);
    assert.equal((await status(order._id, 'Delivered')).status, 409);
});

test('failed refund rolls back cancellation and is safe to retry', async t => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    const injected = t.mock.method(User, 'updateOne', async () => { throw new Error('Injected refund failure'); });
    assert.equal((await cancel(user, order._id)).status, 500);
    injected.mock.restore();
    const saved = await Order.findById(order._id);
    assert.equal(saved.status, 'Waiting for Acceptance');
    assert.equal(saved.creditsRefunded, 0);
    assert.equal(await balance(user), 0);
    assert.equal((await cancel(user, order._id)).status, 200);
    assert.equal(await balance(user), 50);
});

test('admin cancellation refunds credits; customers cannot cancel an accepted order', async () => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    assert.equal((await status(order._id, 'Accepted')).status, 200);
    assert.equal((await cancel(user, order._id)).status, 400);
    assert.equal((await status(order._id, 'Waiting for Acceptance')).status, 400);
    assert.equal((await status(order._id, 'Cancelled')).status, 200);
    assert.equal(await balance(user), 50);
});

test('acceptance racing customer cancellation cannot overwrite a terminal state', async () => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    const responses = await Promise.all([status(order._id, 'Accepted'), cancel(user, order._id)]);
    assert.equal(responses.filter(result => result.status === 200).length, 1);
    const saved = await Order.findById(order._id);
    assert.ok(['Accepted', 'Cancelled'].includes(saved.status));
    assert.equal(await balance(user), saved.status === 'Cancelled' ? 50 : 0);
});

test('real authentication and ownership prevent unauthorized order changes', async () => {
    const { user, body } = await fixture();
    const other = await makeUser();
    const order = (await checkout(user, body)).body;
    assert.equal((await cancel(other, order._id)).status, 403);
    assert.equal((await request(user, `/admin/orders/${order._id}`, 'PUT', { status: 'Delivered' })).status, 403);
    const unauthenticated = await fetch(`${base}/orders/${order._id}/cancel`, { method: 'PUT' });
    assert.equal(unauthenticated.status, 401);
    assert.equal(await balance(user), 0);
});

test('legacy delivered orders are not rewarded again, including zero-reward orders', async () => {
    const { user, restaurant } = await fixture(0);
    const order = await Order.create({
        user: user.id, restaurant: restaurant.id, shippingAddress: 'Test address',
        items: [{ name: 'Rice', quantity: 1, price: 10 }],
        totalPrice: 10, status: 'Delivered', creditsEarned: 0,
    });
    assert.equal((await status(order.id, 'Delivered')).status, 200);
    assert.equal(await balance(user), 0);
    assert.equal((await status(order.id, 'Accepted')).status, 409);
});

test('missing user account rolls back a refund rather than claiming it succeeded', async () => {
    const { user, body } = await fixture();
    const order = (await checkout(user, body)).body;
    await User.deleteOne({ _id: user.id });
    assert.equal((await status(order._id, 'Cancelled')).status, 409);
    const saved = await Order.findById(order._id);
    assert.equal(saved.status, 'Waiting for Acceptance');
    assert.equal(saved.creditsRefunded, 0);
});

test('conflicting simultaneous checkout requests with one key commit only one intent', async () => {
    const { user, body } = await fixture();
    const responses = await Promise.all([
        checkout(user, body),
        checkout(user, { ...body, items: [{ name: 'Rice', quantity: 2 }] }),
    ]);
    assert.deepEqual(responses.map(result => result.status).sort(), [201, 409]);
    assert.equal(await Order.countDocuments({ user: user.id }), 1);
    assert.equal(await balance(user), 0);
});
