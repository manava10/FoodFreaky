const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');

const app = express();

// Middleware
const allowedOrigins = ['http://localhost:3000', 'https://cheerful-cannoli-94af42.netlify.app'];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Welcome to the FoodFreaky API!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
