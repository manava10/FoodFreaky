import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import CouponManager from '../components/CouponManager';
import RestaurantManager from '../components/RestaurantManager';
import OrderManager from '../components/OrderManager';
import SettingsManager from '../components/SettingsManager';
import { AdminPageSkeleton } from '../components/AdminSkeleton';
import './AdminPage.css';

const SuperAdminPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [creditingUsers, setCreditingUsers] = useState(false);
    const [creditAmount, setCreditAmount] = useState(25); // Default credit amount
    const [resettingCredits, setResettingCredits] = useState(false);
    const { authToken } = useAuth();

    useEffect(() => {
        const fetchOrders = async () => {
            if (!authToken) {
                setLoading(false);
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${authToken}` },
                };
                // Fetch all orders by setting a very high limit (10000 should be enough for most cases)
                // For super admin, we want to see all orders, not just the first page
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/orders?limit=10000`, config);
                // Filter out any orders that might have a null user to prevent crashes
                const validOrders = data.data.filter(order => order.user);
                setOrders(validOrders);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [authToken]);

    const totalRevenue = orders.reduce((acc, order) => order.status === 'Delivered' ? acc + order.totalPrice : acc, 0);

    const totalOrders = orders.length;
    const recentOrders = orders.slice(0, 5);

    const downloadReport = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/admin/orders/export?date=${reportDate}`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                    responseType: 'blob', // Important for file download
                }
            );

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders-${reportDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download report:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    const handleCreditAllUsers = async () => {
        // Validate credit amount
        const amount = parseFloat(creditAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid credit amount greater than 0');
            return;
        }

        const confirmMessage = `Are you sure you want to ADD ₹${amount} FoodFreaky credits to ALL users?\n\nThis will ADD to their existing balance (₹${amount} + previous balance).\n\nThis action cannot be undone.`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        setCreditingUsers(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };
            // Add credits to existing balance (X + previous)
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/admin/credit-all-users`,
                { amount: amount }, // Add this amount to existing balance
                config
            );

            if (data.success) {
                alert(`✅ ${data.message}\n💰 Total credits added: ₹${data.totalCreditsDistributed}\n👥 Users credited: ${data.usersCredited}`);
            }
        } catch (error) {
            console.error('Failed to credit users:', error);
            alert(error.response?.data?.msg || 'Failed to credit users. Please try again.');
        } finally {
            setCreditingUsers(false);
        }
    };

    const handleResetAllCredits = async () => {
        const confirmMessage = `⚠️ WARNING: Are you absolutely sure you want to RESET ALL USERS' CREDITS TO ₹0?\n\nThis will set EVERY user's FoodFreaky credit balance to ₹0, regardless of their current balance.\n\nThis action CANNOT be undone!`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        // Double confirmation
        const doubleConfirm = window.confirm('This is your final confirmation. Click OK to proceed with resetting all credits to ₹0.');
        if (!doubleConfirm) {
            return;
        }

        setResettingCredits(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/admin/reset-all-credits`,
                {},
                config
            );

            if (data.success) {
                alert(`✅ ${data.message}\n👥 Users updated: ${data.usersUpdated}`);
            }
        } catch (error) {
            console.error('Failed to reset credits:', error);
            alert(error.response?.data?.msg || 'Failed to reset credits. Please try again.');
        } finally {
            setResettingCredits(false);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Super Admin Dashboard</h1>
                
                {loading ? (
                    <AdminPageSkeleton />
                ) : (
                    <div className="space-y-8">
                        {/* Analytics Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="admin-stat-card">
                                <h3 className="stat-title">Total Revenue</h3>
                                <p className="stat-value">₹{totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="admin-stat-card">
                                <h3 className="stat-title">Total Orders</h3>
                                <p className="stat-value">{totalOrders}</p>
                            </div>
                        </div>

                        {/* Report Generation Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Daily Order Report</h2>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="w-full sm:w-auto">
                                    <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        id="report-date"
                                        value={reportDate}
                                        onChange={(e) => setReportDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <button 
                                    onClick={downloadReport}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md transition duration-200 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download CSV
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Downloads all orders for the selected date, grouped by restaurant.
                            </p>
                        </div>

                        {/* Credit All Users Section */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border border-green-200">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">🎁 Add Credits to All Users</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Add custom FoodFreaky credits to all user accounts. This will <strong>add to</strong> their existing balance (custom amount + previous balance).
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="w-full sm:w-auto flex-1">
                                    <label htmlFor="credit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                                        Credit Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        id="credit-amount"
                                        min="0"
                                        step="0.01"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <button 
                                    onClick={handleCreditAllUsers}
                                    disabled={creditingUsers || !creditAmount || parseFloat(creditAmount) <= 0}
                                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition duration-200 flex items-center gap-2 whitespace-nowrap"
                                >
                                    {creditingUsers ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Crediting Users...
                                        </>
                                    ) : (
                                        <>
                                            💰
                                            Add Credits
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Reset All Credits Section */}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-lg p-6 border border-red-200">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">⚠️ Reset All Credits</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                <strong className="text-red-600">Danger Zone:</strong> This will reset <strong>ALL users'</strong> FoodFreaky credits to ₹0. This action cannot be undone.
                            </p>
                            <button 
                                onClick={handleResetAllCredits}
                                disabled={resettingCredits}
                                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition duration-200 flex items-center gap-2"
                            >
                                {resettingCredits ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting Credits...
                                    </>
                                ) : (
                                    <>
                                        🔄
                                        Reset All Credits to ₹0
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Management Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CouponManager />
                            <RestaurantManager />
                        </div>
                        
                        <SettingsManager />

                        {/* Live Order Management Section */}
                        <div className="admin-management-card mt-8">
                            <h2 className="card-title">Live Order Management</h2>
                            <OrderManager orders={orders} setOrders={setOrders} loading={loading} />
                        </div>

                        {/* Recent Orders List */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">Recent Orders</h2>
                            <div className="admin-order-list recent-orders">
                                {recentOrders.length > 0 ? recentOrders.map(order => (
                                    order.user && ( // Guard clause to prevent crash
                                        <div key={order._id} className="admin-order-card">
                                            <div className="order-details">
                                                <h2 className="order-id">Order #{order._id.substring(0, 8)}</h2>
                                                <p><strong>User:</strong> {order.user.name}</p>
                                                <p><strong>Total:</strong> ₹{order.totalPrice.toFixed(2)}</p>
                                                <p><strong>Status:</strong> <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></p>
                                                {order.rating && (
                                                    <p><strong>Rating:</strong> {order.rating}/5</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )) : (
                                    <p className="text-white">No recent orders.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SuperAdminPage;
