const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { recordVisit } = require('../controllers/traffic');
// Use Express's trusted IP handling; do not trust arbitrary forwarded headers.
const limiter = rateLimit({ windowMs: 60000, limit: 3000, standardHeaders: true, legacyHeaders: false });
router.post('/heartbeat', limiter, (req, res, next) => {
    if (req.headers.authorization) return protect(req, res, next);
    next();
}, recordVisit);
module.exports = router;
