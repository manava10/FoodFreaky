import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './HomePages.css'; // move all CSS here (optional if using Tailwind)

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen relative flex flex-col overflow-hidden">
            {/* Food Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
            >
                {/* Floating emojis */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="floating-element absolute top-20 left-10 text-4xl opacity-30">🍕</div>
                    <div className="floating-element-slow absolute top-40 right-20 text-3xl opacity-25">🍔</div>
                    <div className="floating-element absolute bottom-32 left-1/4 text-4xl opacity-20">🍜</div>
                    <div className="floating-element-slow absolute top-1/3 left-1/2 text-2xl opacity-30">🌮</div>
                    <div className="floating-element absolute bottom-20 right-1/3 text-3xl opacity-25">🍰</div>
                    <div className="floating-element-slow absolute top-60 left-20 text-2xl opacity-20">🥗</div>
                </div>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>

            <Header />

            {/* Promotional Banner */}
            <div className="absolute top-20 left-0 right-0 z-10 bg-orange-100 text-center py-2 px-4 shadow-md">
                <p className="text-sm text-orange-800">
                    Want to add your restaurant? Email us at <a href="mailto:support@foodfreaky.in" className="font-bold underline hover:text-orange-600">support@foodfreaky.in</a>!
                </p>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex flex-grow items-center justify-center px-6">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-light text-white mb-6 leading-tight tracking-wide">
                        Food<span className="text-orange-400 font-normal">Freaky</span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-white mb-8 opacity-90 font-light tracking-wide">
                        Delicious food delivered to your doorstep in minutes
                    </p>
                    <button
                        onClick={() => navigate('/restaurants')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-3 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                    >
                        Order Now 🚀
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-black bg-opacity-60 text-white py-6">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-2xl font-bold">🍕 Food<span className="text-orange-400">Freaky</span></h3>
                            <p className="text-gray-300 mt-1">Satisfy your cravings</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                            <a 
                                href="mailto:support@foodfreaky.in"
                                className="text-orange-300 hover:text-orange-400 transition-colors duration-300 font-medium"
                            >
                                📧 support@foodfreaky.in
                            </a>
                            <div className="flex space-x-4">
                                <button className="text-gray-300 hover:text-white transition-colors duration-300">
                                    📘 Facebook
                                </button>
                                <button className="text-gray-300 hover:text-white transition-colors duration-300">
                                    📷 Instagram
                                </button>
                                <button className="text-gray-300 hover:text-white transition-colors duration-300">
                                    🐦 Twitter
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-600 mt-3 pt-3 text-center">
                        <p className="text-gray-400">
                            © 2025 FoodFreaky. All rights reserved. | Made with ❤️ for food lovers
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;