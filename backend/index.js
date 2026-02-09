const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitizer');

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

const app = express();

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
    console.log(`Server is running on port ${PORT}`);
});
