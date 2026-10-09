const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Restaurant = require('../../models/Restaurant');
const Setting = require('../../models/Setting');
const logger = require('../../utils/logger');
const { createOrder } = require('../../controllers/orders');

const restaurantId = '012345678901234567890123';
const request = () => ({
    body: { restaurant: restaurantId, items: [{ name: 'Rice', quantity: 1 }], shippingAddress: 'Test address' },
    user: { id: '012345678901234567890124', contactNumber: '1234567890' },
});
const response = () => ({
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
});
let restaurantLookup, orderSave, settingsLookup;
const query = (fn) => ({
    session() { return this; },
    then(resolve, reject) { return Promise.resolve().then(fn).then(resolve, reject); },
});
beforeEach(() => {
    mock.method(Order, 'init', async () => {});
    mock.method(mongoose.connection, 'transaction', async callback => callback({}));
    mock.method(logger, 'error', () => {});
    mock.method(logger, 'warn', () => {});
    settingsLookup = mock.method(Setting, 'findOne', () => ({ session() { return this; }, select() { return this; }, lean: async () => ({ isOrderingEnabled: true }) }));
    restaurantLookup = mock.method(Restaurant, 'findById', () => query(async () => ({
        isAcceptingOrders: true,
        menu: [{ category: 'Meals', items: [{ name: 'Rice', price: 35 }] }],
    })));
    orderSave = mock.method(Order.prototype, 'save', async function () { return this; });
});
afterEach(() => mock.restoreAll());

test('disabled global ordering blocks checkout before restaurant lookup or writes', async () => {
    settingsLookup.mock.mockImplementation(() => ({ session() { return this; }, select() { return this; }, lean: async () => ({ isOrderingEnabled: false }) }));
    const res = response();
    await createOrder(request(), res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.msg, /ordering.*disabled/i);
    assert.equal(restaurantLookup.mock.callCount(), 0);
    assert.equal(orderSave.mock.callCount(), 0);
});

test('enabled store permits checkout using server-calculated totals', async () => {
    const res = response();
    await createOrder(request(), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.totalPrice, 88.15);
    assert.equal(orderSave.mock.callCount(), 1);
});

test('missing settings retain the existing enabled default', async () => {
    settingsLookup.mock.mockImplementation(() => ({ session() { return this; }, select() { return this; }, lean: async () => null }));
    const res = response();
    await createOrder(request(), res);
    assert.equal(res.statusCode, 201);
});

test('settings lookup failure prevents checkout and returns the intended error', async () => {
    settingsLookup.mock.mockImplementation(() => ({ session() { return this; }, select() { return this; }, lean: async () => { throw new Error('Database unavailable'); } }));
    const res = response();
    await assert.doesNotReject(() => createOrder(request(), res));
    assert.equal(res.statusCode, 500);
    assert.equal(restaurantLookup.mock.callCount(), 0);
    assert.equal(orderSave.mock.callCount(), 0);
    assert.equal(logger.error.mock.calls[0].arguments[1].restaurantId, restaurantId);
});

test('restaurant database failures do not trigger a second exception', async () => {
    restaurantLookup.mock.mockImplementation(() => query(async () => { throw new Error('Database unavailable'); }));
    const res = response();
    await assert.doesNotReject(() => createOrder(request(), res));
    assert.equal(res.statusCode, 500);
    assert.equal(orderSave.mock.callCount(), 0);
    assert.equal(logger.error.mock.calls[0].arguments[1].error, 'Database unavailable');
});

test('invalid restaurant identifiers retain a client error response', async () => {
    restaurantLookup.mock.mockImplementation(() => query(async () => {
        const error = new Error('Invalid ID');
        error.name = 'CastError';
        error.kind = 'ObjectId';
        throw error;
    }));
    const res = response();
    await assert.doesNotReject(() => createOrder(request(), res));
    assert.equal(res.statusCode, 400);
});

test('restaurant closure is still enforced when global ordering is enabled', async () => {
    restaurantLookup.mock.mockImplementation(() => query(async () => ({ isAcceptingOrders: false })));
    const res = response();
    await createOrder(request(), res);
    assert.equal(res.statusCode, 400);
    assert.equal(orderSave.mock.callCount(), 0);
});


test('unsupported transaction deployment rejects checkout without writes', async () => {
    mongoose.connection.transaction.mock.mockImplementation(async () => {
        const error = new Error('Transaction numbers are only allowed on a replica set member or mongos');
        error.code = 20;
        throw error;
    });
    const res = response();
    await createOrder(request(), res);
    assert.equal(res.statusCode, 503);
    assert.equal(orderSave.mock.callCount(), 0);
    assert.equal(restaurantLookup.mock.callCount(), 0);
});
