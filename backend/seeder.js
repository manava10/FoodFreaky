const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const restaurants = [
    {
        name: 'Ganesh Restaurant',
        cuisine: 'Indian • Authentic Cuisine',
        deliveryTime: '25-35 min',
        tags: ['Spicy', 'Vegetarian Options', 'Popular'],
        menu: [
            {
                category: 'rice',
                items: [
                    { name: 'Steam Rice', price: 130, emoji: '🍚' },
                    { name: 'Jeera Rice', price: 160, emoji: '🌾' },
                    { name: 'Veg Pulao', price: 180, emoji: '🥕' },
                    { name: 'Veg Biryani', price: 200, emoji: '🍛' },
                    { name: 'Paneer Pulao', price: 210, emoji: '🧀' },
                    { name: 'Paneer Biryani', price: 230, emoji: '🍛' },
                    { name: 'Peas Pulao', price: 160, emoji: '🟢' },
                    { name: 'Curd Rice', price: 160, emoji: '🥛' },
                ]
            },
            {
                category: 'breads',
                items: [
                    { name: 'Plain Roti', price: 25, emoji: '🫓' },
                    { name: 'Butter Roti', price: 30, emoji: '🧈' },
                    { name: 'Plain Naan', price: 45, emoji: '🍞' },
                    { name: 'Butter Naan', price: 55, emoji: '🧈' },
                    { name: 'Garlic Naan', price: 60, emoji: '🧄' },
                    { name: 'Tandoori Roti', price: 35, emoji: '🔥' },
                    { name: 'Butter Tandoori Roti', price: 40, emoji: '🧈' },
                    { name: 'Laccha Paratha', price: 55, emoji: '🥞' },
                    { name: 'Stuffed Kulcha', price: 80, emoji: '🥙' },
                ]
            },
            {
                category: 'paneer',
                items: [
                    { name: 'Palak Paneer', price: 180, emoji: '🥬' },
                    { name: 'Mutter Paneer', price: 180, emoji: '🟢' },
                    { name: 'Paneer Butter Masala', price: 200, emoji: '🧈' },
                    { name: 'Handi Paneer', price: 200, emoji: '🏺' },
                    { name: 'Paneer Angara', price: 220, emoji: '🔥' },
                    { name: 'Paneer Tikka Masala', price: 220, emoji: '🍢' },
                ]
            },
            {
                category: 'veg',
                items: [
                    { name: 'The Ganesha Spl.', price: 260, emoji: '👑' },
                    { name: 'Methi Matter Mas.', price: 200, emoji: '🌿' },
                    { name: 'Kobi Chaman', price: 200, emoji: '🥬' },
                    { name: 'Veg Kolhapuri', price: 200, emoji: '🌶️' },
                    { name: 'Veg Jaipuri', price: 200, emoji: '🏰' },
                    { name: 'Malai Kofti Sweet', price: 220, emoji: '🥛' },
                ]
            },
            {
                category: 'green',
                items: [
                    { name: 'Plain Palak', price: 130, emoji: '🥬' },
                    { name: 'Aloo Palak', price: 150, emoji: '🥔' },
                    { name: 'Aloo Gobi', price: 140, emoji: '🥬' },
                    { name: 'Aloo Cholia', price: 140, emoji: '🫘' },
                ]
            },
            {
                category: 'dal',
                items: [
                    { name: 'Dal Fry', price: 130, emoji: '🍲' },
                    { name: 'Dal Mogar', price: 120, emoji: '🟡' },
                    { name: 'Dal Palak', price: 150, emoji: '🥬' },
                    { name: 'Dal Tadka', price: 130, emoji: '🔥' },
                ]
            }
        ]
    }
];

const importData = async () => {
    try {
        await Restaurant.deleteMany();
        await Restaurant.insertMany(restaurants);
        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const deleteData = async () => {
    try {
        await Restaurant.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
