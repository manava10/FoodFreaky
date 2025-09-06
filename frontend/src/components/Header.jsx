import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Modal from './Modal';
import './Header.css';

const Header = () => {
    const { isLoggedIn, user, logout } = useAuth();
    const { cartCount, openCart, clearCart } = useCart();
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

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleMobileLinkClick = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
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
                            onClick={() => navigate('/restaurants')}
                            className="header-btn-primary primary"
                        >
                            Restaurants
                        </button>
                        {isLoggedIn ? (
                            <>
                                <button onClick={() => navigate('/dashboard')} className="header-btn-primary primary">Dashboard</button>
                                <button onClick={handleLogout} className="header-btn-primary destructive">Logout</button>
                                <button onClick={toggleProfileModal} className="header-btn-icon user-profile-circle">
                                    {user && user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </button>
                                <button onClick={openCart} className="header-btn-icon cart-btn">
                                    🛒
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
                        <button onClick={openCart} className="header-btn-icon cart-btn mr-2">
                            🛒
                            <span className="cart-count">{cartCount}</span>
                        </button>
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
                    {isLoggedIn ? (
                        <>
                            <button onClick={() => { handleMobileLinkClick('/dashboard'); toggleProfileModal(); }} className="mobile-menu-link">My Profile</button>
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

            {user && (
                <Modal 
                    show={isProfileModalOpen} 
                    onClose={toggleProfileModal} 
                    title="My Profile"
                    className="profile-modal"
                >
                    <div className="profile-modal-content">
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        {user.contactNumber && <p><strong>Phone:</strong> {user.contactNumber}</p>}
                        <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                        <button 
                            className="view-dashboard-btn" 
                            onClick={() => {
                                toggleProfileModal();
                                navigate('/dashboard');
                            }}
                        >
                            View Full Dashboard
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default Header;
