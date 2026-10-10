const SiteVisit = require('../models/SiteVisit');
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

exports.recordVisit = async (req, res, next) => {
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== 'string' || !/^[a-f0-9]{32}$/.test(sessionId)) {
        return res.status(400).json({ success: false, msg: 'Invalid visit session' });
    }
    if (req.user && req.user.role !== 'user') return res.sendStatus(204);
    try {
        const now = new Date();
        try {
            await SiteVisit.updateOne({ _id: sessionId }, {
                $setOnInsert: { firstSeen: now }, $max: { lastSeen: now },
            }, { upsert: true });
        } catch (error) {
            // Concurrent first heartbeats may race on the unique session ID.
            if (error.code !== 11000) throw error;
            await SiteVisit.updateOne({ _id: sessionId }, { $max: { lastSeen: now } });
        }
        res.sendStatus(204);
    } catch (error) { next(error); }
};

exports.getTraffic = async (req, res, next) => {
    try {
        const now = new Date();
        const [onlineVisitors, totalVisits, firstVisit] = await Promise.all([
            SiteVisit.countDocuments({ lastSeen: { $gt: new Date(now - ACTIVE_WINDOW_MS) } }),
            SiteVisit.countDocuments({}).hint('_id_'),
            SiteVisit.findOne().sort({ firstSeen: 1 }).select('firstSeen').lean(),
        ]);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: {
            onlineVisitors, totalVisits, trackingSince: firstVisit?.firstSeen || null,
            activeWindowSeconds: ACTIVE_WINDOW_MS / 1000, updatedAt: now,
        } });
    } catch (error) { next(error); }
};
