import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './DashboardPage.css';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user, authToken } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${authToken}` },
                };
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/myorders`, config);
                setOrders(data.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchOrders();
        }
    }, [authToken]);
    
    const viewOrderDetails = (order) => setSelectedOrder(order);
    const closeOrderDetails = () => setSelectedOrder(null);
    
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) {
            return;
        }
        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };
            const { data: updatedOrder } = await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`, {}, config);
            
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === orderId ? updatedOrder : order
                )
            );
        } catch (error) {
            const errorMsg = error.response?.data?.msg || "Failed to cancel order. It may no longer be cancellable.";
            alert(errorMsg);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                responseType: 'blob', // This is crucial for handling file downloads
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/orders/${orderId}/invoice`,
                config
            );

            // Create a URL for the blob
            const file = new Blob([data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            
            // Create a temporary link to trigger the download
            const link = document.createElement('a');
            link.href = fileURL;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link); // Clean up the link
        } catch (error) {
            console.error('Failed to download invoice:', error);
            alert('Could not download the invoice. Please try again later.');
        }
    };

    const totalSpent = orders.reduce((acc, order) => acc + order.totalPrice, 0);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'status-delivered';
            case 'pending':
                return 'status-pending';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <div className="dashboard-container">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner */}
                <div className="dashboard-welcome-banner">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white">Welcome back, {user?.name}!</h1>
                        <p className="text-sm md:text-base text-gray-300 mt-2">You have {orders.length} recent orders. Total spent: <span className="font-bold text-white">₹{totalSpent.toFixed(2)}</span></p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-action-buttons">
                    <button onClick={() => navigate('/restaurant')} className="quick-action-btn">
                        <span>🍽️</span> Order New Food
                    </button>
                    <button onClick={() => navigate('/')} className="quick-action-btn">
                        <span>🏠</span> Back to Home
                    </button>
                </div>

                {/* Recent Orders */}
                <div className="recent-orders-section">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Recent Orders</h2>
                    <div className="order-list grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900" onClick={() => viewOrderDetails(order)}>Order #{order._id.substring(0, 8)}</h4>
                                        <p className="text-gray-600 text-sm" onClick={() => viewOrderDetails(order)}>{order.items.map(i => i.name).slice(0, 2).join(', ')}</p>
                                        <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        <div className="mt-2">
                                            <p className="text-gray-400 text-sm">ORDER ID: #{order._id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-lg font-semibold text-white">₹{order.totalPrice.toFixed(2)}</p>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </div>
                                </div>
                                <div className="order-actions">
                                            {order.status === 'Waiting for Acceptance' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                                                    <button 
                                                        className="cancel-order-btn"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                    >
                                                        Cancel Order
                                                    </button>
                                                </div>
                                            )}
                                            {order.status === 'Delivered' && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                                                    <button 
                                                        className="download-invoice-btn"
                                                        onClick={() => handleDownloadInvoice(order._id)}
                                                    >
                                                        Download Bill
                                                    </button>
                                                </div>
                                            )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            
            <Modal show={!!selectedOrder} onClose={closeOrderDetails} title={`Order Details #${selectedOrder?._id.substring(0, 8)}`}>
                {selectedOrder && (
                    <div className="order-details">
                        {selectedOrder.items.map(item => (
                            <div key={item.name} className="order-item">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <hr className="order-divider" />
                        <div className="order-total">
                            <strong>Total:</strong>
                            <strong>₹{selectedOrder.totalPrice.toFixed(2)}</strong>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DashboardPage;
