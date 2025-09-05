import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './DashboardPage.css';

const DashboardPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, authToken } = useAuth();
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
        <div className="min-h-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <button onClick={() => alert('Feature coming soon!')} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-left">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-lg"><span className="text-2xl">🔄</span></div>
                                    <div className="ml-4">
                                        <h3 className="font-semibold text-gray-900">Reorder Favorite</h3>
                                        <p className="text-gray-600 text-sm">Order your usual again</p>
                                    </div>
                                </div>
                            </button>
                            <button onClick={() => alert('Feature coming soon!')} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-left">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-lg"><span className="text-2xl">📍</span></div>
                                    <div className="ml-4">
                                        <h3 className="font-semibold text-gray-900">Track Order</h3>
                                        <p className="text-gray-600 text-sm">See delivery status</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        {/* Past Orders Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                                    <button className="text-orange-500 hover:text-orange-600 font-medium">View All</button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {orders.length > 0 ? orders.map(order => (
                                        <div key={order._id} className="order-card bg-gray-50 rounded-xl p-4 cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-2xl">🛍️</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900" onClick={() => viewOrderDetails(order)}>Order #{order._id.substring(0, 8)}</h4>
                                                        <p className="text-gray-600 text-sm" onClick={() => viewOrderDetails(order)}>{order.items.map(i => i.name).slice(0, 2).join(', ')}</p>
                                                        <p className="text-gray-500 text-xs" onClick={() => viewOrderDetails(order)}>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`${getStatusClass(order.status)} text-white px-3 py-1 rounded-full text-xs font-medium mb-2`}>
                                                        {order.status}
                                                    </div>
                                                    <p className="font-bold text-gray-900">₹{order.totalPrice.toFixed(2)}</p>
                                                </div>
                                            </div>
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
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 text-center py-4">You have no past orders.</p>
                                    )}
                                </div>
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
}

export default DashboardPage;
