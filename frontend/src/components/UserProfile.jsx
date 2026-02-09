import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
    const { authToken, user: tokenUser } = useAuth();
    const { showSuccess, showError: showErrorToast } = useToast();
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [updatingPhone, setUpdatingPhone] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (isOpen && authToken) {
            fetchUserProfile();
        }
    }, [isOpen, authToken]);

    useEffect(() => {
        if (userDetails) {
            setPhoneNumber(userDetails.contactNumber || '');
        }
    }, [userDetails]);

    const handleUpdatePhone = async () => {
        if (phoneNumber.length !== 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            return;
        }

        setUpdatingPhone(true);
        setPhoneError('');

        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };

            const { data } = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/auth/profile`,
                { contactNumber: phoneNumber },
                config
            );

            if (data.success) {
                setUserDetails({ ...userDetails, contactNumber: phoneNumber });
                setIsEditingPhone(false);
                showSuccess('Phone number updated successfully! 📱');
            }
        } catch (error) {
            console.error('Failed to update phone number:', error);
            const errorMsg = error.response?.data?.msg || 'Failed to update phone number. Please try again.';
            setPhoneError(errorMsg);
            showErrorToast(errorMsg);
        } finally {
            setUpdatingPhone(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };

            // Fetch user details, stats, and credits in parallel
            const [userResponse, ordersResponse, creditsResponse] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`, config),
                axios.get(`${process.env.REACT_APP_API_URL}/api/orders/myorders?limit=1000`, config),
                axios.get(`${process.env.REACT_APP_API_URL}/api/credits`, config).catch(() => ({ data: { credits: 0 } }))
            ]);

            const userData = userResponse.data.data;
            const orders = ordersResponse.data.data || [];
            const credits = creditsResponse.data.credits || 0;

            // Calculate statistics
            const totalOrders = orders.length;
            const completedOrders = orders.filter(o => o.status === 'Delivered').length;
            const totalSpent = orders
                .filter(o => o.status === 'Delivered')
                .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const pendingOrders = orders.filter(o => 
                ['Waiting for Acceptance', 'Accepted', 'Preparing Food', 'Out for Delivery'].includes(o.status)
            ).length;
            const averageOrderValue = completedOrders > 0 ? totalSpent / completedOrders : 0;

            setUserDetails({ ...userData, credits });
            setStats({
                totalOrders,
                completedOrders,
                pendingOrders,
                totalSpent,
                averageOrderValue
            });
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="user-profile-overlay" onClick={onClose}>
            <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-profile-header">
                    <h2 className="user-profile-title">My Profile</h2>
                    <button onClick={onClose} className="user-profile-close">&times;</button>
                </div>

                {loading ? (
                    <div className="user-profile-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading profile...</p>
                    </div>
                ) : userDetails ? (
                    <div className="user-profile-content">
                        {/* Profile Header Section */}
                        <div className="profile-header-section">
                            <div className="profile-avatar">
                                {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="profile-header-info">
                                <h3 className="profile-name">{userDetails.name}</h3>
                                <p className="profile-email">{userDetails.email}</p>
                                {userDetails.role && userDetails.role !== 'user' && (
                                    <span className="profile-badge">{userDetails.role}</span>
                                )}
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        {stats && (
                            <div className="profile-stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">📦</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.totalOrders}</div>
                                        <div className="stat-label">Total Orders</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.completedOrders}</div>
                                        <div className="stat-label">Completed</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">⏳</div>
                                    <div className="stat-info">
                                        <div className="stat-value">{stats.pendingOrders}</div>
                                        <div className="stat-label">Pending</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-info">
                                        <div className="stat-value">₹{stats.totalSpent.toFixed(2)}</div>
                                        <div className="stat-label">Total Spent</div>
                                    </div>
                                </div>
                                {userDetails && userDetails.credits !== undefined && (
                                    <div className="stat-card credits-card">
                                        <div className="stat-icon">🎁</div>
                                        <div className="stat-info">
                                            <div className="stat-value">₹{userDetails.credits}</div>
                                            <div className="stat-label">FoodFreaky Credits</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User Details Section */}
                        <div className="profile-details-section">
                            <h4 className="section-title">Account Details</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        Full Name
                                    </span>
                                    <span className="detail-value">{userDetails.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                        Email
                                    </span>
                                    <span className="detail-value">{userDetails.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                        </svg>
                                        Phone Number
                                    </span>
                                    {isEditingPhone ? (
                                        <div className="phone-edit-container">
                                            <input
                                                type="text"
                                                value={phoneNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setPhoneNumber(value);
                                                    setPhoneError('');
                                                }}
                                                placeholder="Enter 10-digit phone number"
                                                className={`phone-input ${phoneError ? 'error' : ''}`}
                                                disabled={updatingPhone}
                                            />
                                            {phoneError && <span className="phone-error">{phoneError}</span>}
                                            <div className="phone-edit-actions">
                                                <button
                                                    onClick={handleUpdatePhone}
                                                    disabled={updatingPhone || phoneNumber.length !== 10}
                                                    className="phone-save-btn"
                                                >
                                                    {updatingPhone ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingPhone(false);
                                                        setPhoneNumber(userDetails.contactNumber || '');
                                                        setPhoneError('');
                                                    }}
                                                    disabled={updatingPhone}
                                                    className="phone-cancel-btn"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="phone-display-container">
                                            <span className="detail-value">
                                                {userDetails.contactNumber === '0000000000' 
                                                    ? 'Not set (Click to update)' 
                                                    : userDetails.contactNumber}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setIsEditingPhone(true);
                                                    setPhoneNumber(userDetails.contactNumber || '');
                                                    setPhoneError('');
                                                }}
                                                className="phone-edit-btn"
                                                title="Edit phone number"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        Member Since
                                    </span>
                                    <span className="detail-value">
                                        {new Date(userDetails.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                        </svg>
                                        Account Status
                                    </span>
                                    <span className="detail-value">
                                        <span className={`status-indicator ${userDetails.isVerified ? 'verified' : 'unverified'}`}>
                                            {userDetails.isVerified ? '✓ Verified' : '⚠ Unverified'}
                                        </span>
                                    </span>
                                </div>
                                {stats && stats.completedOrders > 0 && (
                                    <div className="detail-item">
                                        <span className="detail-label">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                            </svg>
                                            Average Order Value
                                        </span>
                                        <span className="detail-value">₹{stats.averageOrderValue.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            <button 
                                className="profile-action-btn primary"
                                onClick={() => {
                                    onClose();
                                    navigate('/dashboard');
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                View Dashboard
                            </button>
                            <button 
                                className="profile-action-btn secondary"
                                onClick={() => {
                                    onClose();
                                    navigate('/favorites');
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                                My Favorites
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="user-profile-error">
                        <p>Failed to load profile</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
