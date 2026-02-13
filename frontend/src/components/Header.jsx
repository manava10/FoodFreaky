import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import UserProfile from './UserProfile';
import './Header.css';

const Header = () => {
    const { isLoggedIn, user, logout } = useAuth();
    const { cartCount, openCart, clearCart } = useCart();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        clearCart(); // Clear the cart from localStorage on logout
        navigate('/');
    };

    const toggleProfileModal = () => {
        setIsProfileModalOpen(!isProfileModalOpen);
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleMobileLinkClick = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const handleMobileProfileOpen = () => {
        setIsMobileMenuOpen(false);
        setTimeout(() => {
            setIsProfileModalOpen(true);
        }, 120);
    };

    return (
        <>
            <header className="relative z-20 p-4 sm:p-6">
                <nav className="flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo */}
                    <div 
                        className="text-3xl sm:text-4xl font-bold text-white cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        🍕 Food<span className="text-orange-500">Freaky</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="header-btn-icon"
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/restaurants')}
                            className="header-btn-primary primary"
                        >
                            Restaurants
                        </button>
                        <button
                            onClick={() => navigate('/fruits')}
                            className="header-btn-primary primary"
                        >
                            Fruits
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={() => navigate('/favorites')}
                                className="header-btn-primary primary"
                            >
                                Favorites
                            </button>
                        )}
                        {isLoggedIn ? (
                            <>
                                <button onClick={() => navigate('/dashboard')} className="header-btn-primary primary">Dashboard</button>
                                <button onClick={handleLogout} className="header-btn-primary destructive">Logout</button>
                                <button onClick={toggleProfileModal} className="header-btn-icon user-profile-circle">
                                    {user && user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </button>
                                <button onClick={openCart} className="header-btn-icon cart-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="cart-count">{cartCount}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="header-btn-primary primary"
                                >
                                    Register
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="header-btn-primary primary"
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleTheme}
                            className="header-btn-icon mr-2"
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>
                        <button onClick={openCart} className="header-btn-icon cart-btn mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="cart-count">{cartCount}</span>
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={openProfileModal}
                                className="header-btn-icon user-profile-circle mr-2"
                                aria-label="Open profile"
                            >
                                {user && user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </button>
                        )}
                        <button onClick={toggleMobileMenu} className="text-white text-3xl">
                            ☰
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-gray-900 bg-opacity-95 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
                <div className="flex justify-end p-6">
                    <button onClick={toggleMobileMenu} className="text-white text-4xl">&times;</button>
                </div>
                <div className="flex flex-col items-center space-y-8">
                    <button onClick={() => handleMobileLinkClick('/restaurants')} className="mobile-menu-link">Restaurants</button>
                    <button onClick={() => handleMobileLinkClick('/fruits')} className="mobile-menu-link">Fruits</button>
                    {isLoggedIn && (
                        <button onClick={() => handleMobileLinkClick('/favorites')} className="mobile-menu-link">Favorites</button>
                    )}
                    {isLoggedIn ? (
                        <>
                            <button onClick={() => handleMobileLinkClick('/dashboard')} className="mobile-menu-link">Dashboard</button>
                            <button onClick={handleMobileProfileOpen} className="mobile-menu-link">My Profile</button>
                            <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="mobile-menu-link text-red-400">Logout</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleMobileLinkClick('/register')} className="mobile-menu-link">Register</button>
                            <button onClick={() => handleMobileLinkClick('/login')} className="mobile-menu-link">Login</button>
                        </>
                    )}
                </div>
            </div>

            <UserProfile 
                isOpen={isProfileModalOpen} 
                onClose={toggleProfileModal}
            />
        </>
    );
};

export default Header;
