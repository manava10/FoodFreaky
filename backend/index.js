const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

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
app.use(helmet());

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
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
