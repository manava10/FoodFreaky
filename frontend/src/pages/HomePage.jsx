import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePages.css'; // move all CSS here (optional if using Tailwind)

const Homepage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleNavClick = (section) => {
        switch (section) {
            case 'Restaurants':
                navigate('/restaurants');
                break;
            case 'Register':
                navigate('/register');
                break;
            case 'Login':
                navigate('/login');
                break;
            case 'Contact Us':
                navigate('/contact');
                break;
            default:
                break;
        }
    };

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

            {/* Header */}
            <header className="relative z-10 p-6">
                <nav className="flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo */}
                    <div className="text-4xl font-bold text-white">🍕 Food<span className="text-orange-400">Freaky</span></div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button
                            onClick={() => handleNavClick('Restaurants')}
                            className="bg-white bg-opacity-10 backdrop-blur-sm text-white hover:bg-orange-500 hover:bg-opacity-100 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-normal border border-white border-opacity-30 shadow-lg tracking-wide"
                        >
                            🍽️ Restaurants
                        </button>
                        <button
                            onClick={() => handleNavClick('Register')}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-normal shadow-xl hover:shadow-2xl tracking-wide"
                        >
                            ✨ Register
                        </button>
                        <button
                            onClick={() => handleNavClick('Login')}
                            className="bg-transparent border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-normal shadow-lg hover:shadow-xl tracking-wide"
                        >
                            🔐 Login
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={toggleMenu} className="md:hidden text-white text-2xl">
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                </nav>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 bg-black bg-opacity-80 rounded-lg p-4">
                        <div className="flex flex-col space-y-4">
                            <button
                                onClick={() => handleNavClick('Restaurants')}
                                className="bg-white bg-opacity-10 backdrop-blur-sm text-white hover:bg-orange-500 hover:bg-opacity-100 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold border border-white border-opacity-30 text-left"
                            >
                                🍽️ Restaurants
                            </button>
                            <button
                                onClick={() => handleNavClick('Register')}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold shadow-xl hover:shadow-2xl"
                            >
                                ✨ Register
                            </button>
                            <button
                                onClick={() => handleNavClick('Login')}
                                className="bg-transparent border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                            >
                                🔐 Login
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-grow items-center justify-center px-6">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-6xl md:text-8xl font-light text-white mb-6 leading-tight tracking-wide">
                        Food<span className="text-orange-400 font-normal">Freaky</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white mb-8 opacity-90 font-light tracking-wide">
                        Delicious food delivered to your doorstep in minutes
                    </p>
                    <button
                        onClick={() => handleNavClick('Restaurants')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-12 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                    >
                        Order Now 🚀
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-black bg-opacity-60 text-white py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-2xl font-bold">🍕 Food<span className="text-orange-400">Freaky</span></h3>
                            <p className="text-gray-300 mt-1">Satisfy your cravings</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                            <button
                                onClick={() => handleNavClick('Contact Us')}
                                className="text-orange-300 hover:text-orange-400 transition-colors duration-300 font-medium"
                            >
                                📞 Contact Us
                            </button>
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

                    <div className="border-t border-gray-600 mt-6 pt-6 text-center">
                        <p className="text-gray-400">
                            © 2025 FoodFreaky. All rights reserved. | Made with ❤️ for food lovers
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Homepage;