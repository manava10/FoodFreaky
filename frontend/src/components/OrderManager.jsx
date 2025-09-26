import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../pages/AdminPage.css'; // Corrected path

const OrderManager = ({ orders, setOrders, loading }) => {
    const { authToken } = useAuth();
    const [statusUpdates, setStatusUpdates] = useState({});

    const orderStatuses = ['Waiting for Acceptance', 'Accepted', 'Preparing Food', 'Out for Delivery', 'Delivered', 'Cancelled'];

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
            alert('Order status updated successfully!');
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status.');
        }
    };

    if (loading) {
        return <p className="text-white text-center">Loading orders...</p>;
    }

    // Group orders by date
    const groupedOrders = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(order);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="admin-order-list-container">
            {orders.length > 0 ? (
                sortedDates.map(date => (
                    <div key={date} className="date-group">
                        <h3 className="date-header">{date}</h3>
                        <div className="admin-order-list">
                            {groupedOrders[date].map(order => (
                                order.user && (
                                    <div key={order._id} className="admin-order-card">
                                        <div className="order-details">
                                            <h2 className="order-id">Order #{order._id.substring(0, 8)}</h2>
                                            <p><strong>Restaurant:</strong> {order.restaurant ? order.restaurant.name : 'N/A'}</p>
                                            <p><strong>User:</strong> {order.user.name} ({order.user.email})</p>
                                            {order.user.contactNumber && <p><strong>Phone:</strong> {order.user.contactNumber}</p>}
                                            <p><strong>Address:</strong> {order.shippingAddress}</p>
                                            <p><strong>Total:</strong> ₹{order.totalPrice.toFixed(2)}</p>
                                            <p><strong>Status:</strong> <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></p>
                                            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                                            {order.rating && (
                                                <div className="mt-2">
                                                    <p><strong>Rating:</strong> {order.rating}/5</p>
                                                    <p><strong>Review:</strong> {order.review}</p>
                                                </div>
                                            )}
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
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-white text-center">No orders found.</p>
            )}
        </div>
    );
};

export default OrderManager;
