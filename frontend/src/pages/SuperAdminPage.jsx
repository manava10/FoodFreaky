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
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/orders`, config);
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
