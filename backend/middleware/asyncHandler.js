/**
 * Async handler wrapper to catch errors in async routes
 * Eliminates the need for try-catch blocks in controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
