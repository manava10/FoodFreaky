import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import { OrderListSkeleton } from '../components/OrderCardSkeleton';
import { EmptyOrders } from '../components/EmptyState';
import './AdminPage.css';

const DeliveryAdminPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useAuth();
    const { showSuccess, showError } = useToast();
    const [statusUpdates, setStatusUpdates] = useState({});

    const orderStatuses = ['Waiting for Acceptance', 'Accepted', 'Preparing Food', 'Out for Delivery', 'Delivered', 'Cancelled'];

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
                setOrders(data.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [authToken]);

    const handleStatusChange = (orderId, newStatus) => {
        setStatusUpdates(prev => ({ ...prev, [orderId]: newStatus }));
    };

    const handleUpdateOrder = async (orderId) => {
        const newStatus = statusUpdates[orderId];
        if (!newStatus) return;

        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };
            const { data: updatedOrder } = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/orders/${orderId}`, { status: newStatus }, config);

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: updatedOrder.status } : order
                )
            );
            showSuccess('Order status updated successfully!');
        } catch (error) {
            console.error('Failed to update order status:', error);
            showError('Failed to update order status.');
        }
    };

    return (
        <div className="admin-page-container">
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Delivery Admin Dashboard</h1>
                
                {loading ? (
                    <div className="space-y-4">
                        <OrderListSkeleton count={5} />
                    </div>
                ) : (
                    <div className="admin-order-list">
                        {orders.length > 0 ? orders.map(order => (
                            order.user && ( // Guard clause to prevent crash
                                <div key={order._id} className="admin-order-card">
                                    <div className="order-details">
                                        <h2 className="order-id">Order #{order._id.substring(0, 8)}</h2>
                                        <p><strong>User:</strong> {order.user.name} ({order.user.email})</p>
                                        <p><strong>Contact:</strong> {order.user.contactNumber || 'N/A'}</p>
                                        <p><strong>Address:</strong> {order.shippingAddress}</p>
                                        <p><strong>Total:</strong> ₹{order.totalPrice.toFixed(2)}</p>
                                        <p><strong>Status:</strong> <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></p>
                                        <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                                        <div className="order-items-summary">
                                            <strong>Items:</strong>
                                            <ul>
                                                {order.items.map(item => (
                                                    <li key={item.name}>{item.name} (x{item.quantity})</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="order-actions">
                                        <select 
                                            className="status-select"
                                            value={statusUpdates[order._id] || order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        >
                                            {orderStatuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <button 
                                            className="update-status-btn"
                                            onClick={() => handleUpdateOrder(order._id)}
                                        >
                                            Update Status
                                        </button>
                                    </div>
                                </div>
                            )
                        )) : (
                            <EmptyOrders isAdmin={true} className="empty-state-transparent" />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DeliveryAdminPage;
