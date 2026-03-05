import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './HomePages.css'; // move all CSS here (optional if using Tailwind)
import foodBackground from '../assets/images/food-background.jpg';

const HomePage = () => {
    const navigate = useNavigate();
    const [couponCopied, setCouponCopied] = useState(false);
    const [couponRevealed, setCouponRevealed] = useState(false);
    const today = new Date();
    const isValentineWeek = today.getMonth() === 1 && today.getDate() >= 10 && today.getDate() <= 16;
    const couponCode = 'LOVE35';

    const handleCopyCoupon = async () => {
        try {
            await navigator.clipboard.writeText(couponCode);
            setCouponCopied(true);
            setTimeout(() => setCouponCopied(false), 1800);
        } catch (error) {
            setCouponCopied(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col overflow-x-hidden dark:bg-gray-900">
            {/* Food Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${foodBackground})` }}
            >
                {/* Floating emojis */}
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="floating-element absolute top-20 left-10 text-4xl opacity-30">🍕</div>
                    <div className="floating-element-slow absolute top-40 right-20 text-3xl opacity-25">🍔</div>
                    <div className="floating-element absolute bottom-32 left-1/4 text-4xl opacity-20">🍜</div>
                    <div className="floating-element-slow absolute top-1/3 left-1/2 text-2xl opacity-30">🌮</div>
                    <div className="floating-element absolute bottom-20 right-1/3 text-3xl opacity-25">🍰</div>
                    <div className="floating-element-slow absolute top-60 left-20 text-2xl opacity-20">🥗</div>
                    {isValentineWeek && (
                        <>
                            <div className="floating-heart absolute top-24 right-1/4 text-3xl opacity-50">❤️</div>
                            <div className="floating-heart-slow absolute bottom-28 left-1/3 text-2xl opacity-45">💕</div>
                            <div className="floating-heart absolute top-1/2 right-10 text-2xl opacity-40">💖</div>
                        </>
                    )}
                </div>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>

            <Header />

            {/* Banners */}
            <div className="absolute top-20 left-0 right-0 z-10 text-center shadow-md">
                {isValentineWeek && (
                    <div className="valentine-banner py-2 px-4">
                        <p className="text-sm sm:text-base text-white font-semibold tracking-wide">
                            Valentine Week Special: Tap to find out your gift from us 🎁
                        </p>
                    </div>
                )}
                <div className="bg-blue-100 py-2 px-4">
                    <p className="text-sm text-blue-800 font-semibold">
                        We only serve on Saturday, Sunday, and Monday evenings.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex flex-grow items-start md:items-center justify-center px-4 sm:px-6 pt-44 sm:pt-40 md:pt-24 pb-6">
                {isValentineWeek ? (
                    <div className="w-full max-w-6xl mx-auto valentine-hero-grid">
                        <section className="text-left text-white">
                            <p className="valentine-badge inline-flex items-center gap-2 mb-5">
                                <span>Valentine Week</span>
                                <span>Feb 10 - Feb 16</span>
                            </p>
                            <h1 className="text-3xl sm:text-5xl md:text-7xl font-light mb-4 sm:mb-5 leading-[1.12]">
                                Love at first bite with
                                <span className="block text-pink-300 font-normal mt-1">FoodFreaky</span>
                            </h1>
                            <p className="text-sm sm:text-lg md:text-xl opacity-90 max-w-xl mb-5 sm:mb-6">
                                Send comfort food, desserts, and fresh picks in minutes.
                                Celebrate this week with a special offer for every lovely order.
                            </p>
                            <div className="flex flex-wrap gap-3 mb-4">
                                <button
                                    onClick={() => navigate('/restaurants')}
                                    className="valentine-cta w-full sm:w-auto bg-pink-500 hover:bg-pink-600 text-white px-8 sm:px-10 py-3 rounded-full text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                                >
                                    Start Romantic Order ❤️
                                </button>
                                <button
                                    onClick={() => navigate('/fruits')}
                                    className="w-full sm:w-auto px-8 sm:px-10 py-3 rounded-full text-base sm:text-lg font-bold text-white border border-pink-200 bg-pink-900/35 hover:bg-pink-900/55 transition-colors duration-300"
                                >
                                    Add Fresh Fruits 🍓
                                </button>
                            </div>
                            <p className="inline-block valentine-chip px-4 py-1 rounded-full text-sm sm:text-base font-medium text-white">
                                Offer valid this week only
                            </p>
                        </section>

                        <aside className="valentine-offer-card p-4 sm:p-7 text-white">
                            <p className="text-sm uppercase tracking-widest font-semibold opacity-90 mb-2">
                                Exclusive Coupon
                            </p>
                            <h2 className="text-xl sm:text-3xl font-bold mb-2">Get Flat Discount</h2>
                            <p className="text-sm sm:text-base opacity-90 mb-4">
                                Tap below to reveal your Valentine's gift coupon.
                            </p>

                            {!couponRevealed ? (
                                <button
                                    onClick={() => setCouponRevealed(true)}
                                    className="w-full sm:w-auto mt-1 px-5 py-2 rounded-full bg-white text-pink-600 font-bold text-sm sm:text-base hover:bg-pink-50 transition-colors duration-200"
                                >
                                    Tap to find out gift from us 🎁
                                </button>
                            ) : (
                                <>
                                    <div className="coupon-code-pill text-2xl sm:text-3xl font-extrabold tracking-wider mb-4">
                                        {couponCode}
                                    </div>
                                    <button
                                        onClick={handleCopyCoupon}
                                        className="w-full sm:w-auto mt-1 px-5 py-2 rounded-full bg-white text-pink-600 font-bold text-sm sm:text-base hover:bg-pink-50 transition-colors duration-200"
                                    >
                                        {couponCopied ? 'Copied: LOVE35' : 'Copy Code'}
                                    </button>
                                </>
                            )}

                            <div className="mt-4 text-xs sm:text-sm opacity-90">
                                Tip: apply before placing order.
                            </div>
                        </aside>
                    </div>
                ) : (
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
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-black bg-opacity-60 text-white py-0">
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
                                <a 
                                    href="https://www.instagram.com/foodfreakyindia?igsh=MW9nMjF5ZDFhYXhhOQ==" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-gray-300 hover:text-white transition-colors duration-300"
                                >
                                    📷 Instagram
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-600 mt-2 pt-2 text-center">
                        <p className="text-gray-400 text-sm">
                            © 2025 FoodFreaky. All rights reserved. | Made with ❤️ for food lovers {isValentineWeek && 'and extra love this week 💕'}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;