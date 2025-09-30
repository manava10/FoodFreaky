const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // These options are deprecated in Mongoose 6+ and no longer needed
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
