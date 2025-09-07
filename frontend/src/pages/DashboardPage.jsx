import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user, authToken } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

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
        <div className="min-h-screen relative">
            {/* Food Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
                }}
            >
                {/* Animated floating elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="floating-element absolute top-20 left-10 text-3xl opacity-20">🍕</div>
                    <div className="floating-element-slow absolute top-40 right-20 text-2xl opacity-15">🍔</div>
                    <div className="floating-element absolute bottom-32 left-1/4 text-3xl opacity-15">🍜</div>
                    <div className="floating-element-slow absolute top-1/3 right-1/4 text-2xl opacity-20">🌮</div>
                    <div className="floating-element absolute bottom-20 right-1/3 text-2xl opacity-15">🍰</div>
                </div>
                
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            </div>
            
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {loading ? (
                    <p className="text-white text-center">Loading dashboard...</p>
                ) : user && (
                    <>
                        {/* Welcome Section */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                                    <p className="text-orange-100 text-lg">Ready for your next delicious meal?</p>
                                    <div className="mt-4 flex items-center space-x-2 md:space-x-6">
                                        <div className="bg-white/20 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold">{orders.length}</div>
                                            <div className="text-sm text-orange-100">Total Orders</div>
                                        </div>
                                        <div className="bg-white/20 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
                                            <div className="text-sm text-orange-100">Total Spent</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-6xl">🍕</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                {/* Quick Actions */}
                <div className="quick-action-buttons">
                </div>

                {/* Recent Orders */}
                <div className="recent-orders-section">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Recent Orders</h2>
                    <div className="flex flex-col gap-6">
                        {orders.map(order => (
                            <div key={order._id} className="order-card p-4 rounded-lg shadow-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-gray-900" onClick={() => viewOrderDetails(order)}>Order #{order._id.substring(0, 8)}</h4>
                                        <p className="text-gray-600 text-sm" onClick={() => viewOrderDetails(order)}>{order.items.map(i => i.name).slice(0, 2).join(', ')}</p>
                                        <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-lg font-semibold text-gray-900">₹{order.totalPrice.toFixed(2)}</p>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </div>
                                </div>
                                <div className="order-actions mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                            {order.status === 'Waiting for Acceptance' && (
                                                    <button 
                                                        className="cancel-order-btn"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                    >
                                                        Cancel Order
                                                    </button>
                                            )}
                                            {order.status === 'Delivered' && (
                                                    <button 
                                                        className="download-invoice-btn"
                                                        onClick={() => handleDownloadInvoice(order._id)}
                                                    >
                                                        Download Bill
                                                    </button>
                                            )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
            )}
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
