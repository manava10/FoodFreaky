const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitizer');
// Load logger with error handling
let logger;
try {
    logger = require('./utils/logger');
} catch (error) {
    console.error('Failed to load logger:', error.message);
    // Fallback to console logger if winston fails
    logger = {
        info: (...args) => console.log('[INFO]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        debug: (...args) => console.log('[DEBUG]', ...args),
    };
}

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'EMAIL_USERNAME',
    'EMAIL_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Connect to database
connectDB();

const auth = require('./routes/auth');
const orders = require('./routes/orders');
const restaurants = require('./routes/restaurants');
const coupons = require('./routes/coupons');
const admin = require('./routes/admin');
const settings = require('./routes/settings');
const favorites = require('./routes/favorites');
const credits = require('./routes/credits');

const app = express();

// Trust proxy - Required when behind Cloudflare or other reverse proxies
// This allows Express to read the real client IP from X-Forwarded-For or CF-Connecting-IP headers
if (process.env.NODE_ENV === 'production' || process.env.BEHIND_PROXY === 'true') {
    app.set('trust proxy', 1); // Trust first proxy (Cloudflare)
    logger.info('Trust proxy enabled - configured for Cloudflare/reverse proxy');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin requests
}));

// Middleware
const allowedOrigins = [
    'http://localhost:3000', // Previous local IP (if you reconnect)
    'https://bid-womens-indices-subjects.trycloudflare.com', // Cloudflare tunnel frontend
    'https://cheerful-cannoli-94af42.netlify.app',
    'https://foodfreaky.in',
    'https://www.foodfreaky.in',
    'https://foodfreakyfr-qoh9u.ondigitalocean.app'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Security: Rate limiting and input sanitization
app.use('/api', generalLimiter); // Apply rate limiting to all API routes
app.use(sanitizeInput); // Sanitize all input

// Mount routers
app.use('/api/auth', auth);
app.use('/api/orders', orders);
app.use('/api/restaurants', restaurants);
app.use('/api/coupons', coupons);
app.use('/api/admin', admin);
app.use('/api/settings', settings);
app.use('/api/favorites', favorites);
app.use('/api/credits', credits);

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Welcome to the FoodFreaky API!');
});

// Global error handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
