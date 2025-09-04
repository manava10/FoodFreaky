import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Modal from './Modal';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user, logout } = useAuth();
    const { cartCount, openCart } = useCart();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleNavClick = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleProfileModal = () => {
        setIsProfileModalOpen(!isProfileModalOpen);
    };

    return (
        <>
            <header className="relative z-10 p-6">
                <nav className="flex items-center justify-between max-w-7xl mx-auto">
                    {/* Logo */}
                    <div 
                        className="text-4xl font-bold text-white cursor-pointer"
                        onClick={() => handleNavClick('/')}
                    >
                        🍕 Food<span className="text-orange-500">Freaky</span>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => handleNavClick('/restaurants')}
                            className="header-btn-primary primary"
                        >
                            Restaurants
                        </button>
                        {isLoggedIn ? (
                            <>
                                <button onClick={handleLogout} className="header-btn-primary destructive">Logout</button>
                                <button className="header-btn-icon user-profile-circle" onClick={toggleProfileModal}>
                                    <span>{user ? user.name.charAt(0) : 'U'}</span>
                                </button>
                                <button onClick={openCart} className="header-btn-icon cart-btn">
                                    🛒
                                    <span className="cart-count">{cartCount}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleNavClick('/register')}
                                    className="header-btn-primary primary"
                                >
                                    Register
                                </button>
                                <button
                                    onClick={() => handleNavClick('/login')}
                                    className="header-btn-primary primary"
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </nav>
            </header>

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
