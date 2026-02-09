const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const creditAllUsers = async () => {
    try {
        // Connect to MongoDB using the same connection function as the main app
        await connectDB();
        console.log('MongoDB connected...');

        // Credit all users with 25 rupees
        const result = await User.updateMany(
            {}, // Match all users
            { 
                $inc: { credits: 25 } // Increment credits by 25
            }
        );

        console.log(`✅ Successfully credited ₹25 to ${result.modifiedCount} users!`);
        console.log(`📊 Total users matched: ${result.matchedCount}`);

        // Get total credits distributed
        const totalCredits = result.modifiedCount * 25;
        console.log(`💰 Total credits distributed: ₹${totalCredits}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error crediting users:', error);
        process.exit(1);
    }
};

// Run the script
creditAllUsers();
