import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import CouponManager from '../components/CouponManager';
import RestaurantManager from '../components/RestaurantManager';
import OrderManager from '../components/OrderManager';
import './AdminPage.css';

const SuperAdminPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="admin-page-container">
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Super Admin Dashboard</h1>
                
                {loading ? (
                    <p className="text-white text-center">Loading data...</p>
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

                        {/* Management Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CouponManager />
                            <RestaurantManager />
                        </div>

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
