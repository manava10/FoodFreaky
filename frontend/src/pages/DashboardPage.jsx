import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import SuccessModal from '../components/SuccessModal';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Rating from '../components/Rating'; // Assuming you have a Rating component
import './DashboardPage.css';
import foodBackground from '../assets/images/food-background.jpg';

const DashboardPage = () => {
    const { user, authToken } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    const openRatingModal = (order) => {
        setSelectedOrderForRating(order);
        setRatingModalOpen(true);
    };

    const closeRatingModal = () => {
        setRatingModalOpen(false);
        setSelectedOrderForRating(null);
        setRating(0);
        setReview('');
    };

    const handleRatingSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating.');
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/orders/${selectedOrderForRating._id}/rate`,
                { rating, review },
                config
            );
            
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === selectedOrderForRating._id ? { ...order, rating, review } : order
                )
            );

            closeRatingModal();
            setShowSuccessModal(true);

        } catch (error) {
            const errorMsg = error.response?.data?.msg || "Failed to submit rating.";
            alert(errorMsg);
        }
    };
    
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

    const successfulOrders = orders.filter(order => order.status === 'Delivered');
    const totalSpent = successfulOrders.reduce((acc, order) => acc + order.totalPrice, 0);

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
        <div className="min-h-screen bg-gray-900" style={{ backgroundImage: `url(${foodBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-0"></div>
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
                                            <div className="text-2xl font-bold">{successfulOrders.length}</div>
                                            <div className="text-sm text-orange-100">Completed Orders</div>
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
                                        <p className="font-bold text-orange-600 text-sm">{order.restaurant ? order.restaurant.name : 'Restaurant'}</p>
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
                                            {order.status === 'Delivered' && !order.rating && (
                                                <button 
                                                    className="rate-order-btn"
                                                    onClick={() => openRatingModal(order)}
                                                >
                                                    Rate Order
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && order.rating && (
                                                <Rating value={order.rating} />
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
                        <p className="text-lg font-semibold mb-2">
                            From: <span className="text-orange-600">{selectedOrder.restaurant ? selectedOrder.restaurant.name : 'Restaurant'}</span>
                        </p>
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
            
            <Modal show={ratingModalOpen} onClose={closeRatingModal} title="Rate Your Order">
                {selectedOrderForRating && (
                    <div className="rating-modal">
                        <p>How was your experience with {selectedOrderForRating.restaurant.name}?</p>
                        <div className="my-4">
                            <label className="block text-sm font-medium text-gray-700">Your Rating</label>
                            {/* This is a simplified rating input. You can replace with a star component */}
                            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md">
                                <option value="0" disabled>Select rating</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                            </select>
                        </div>
                        <div className="my-4">
                            <label htmlFor="review" className="block text-sm font-medium text-gray-700">Your Review</label>
                            <textarea
                                id="review"
                                name="review"
                                rows="3"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="shadow-sm focus:ring-orange-500 focus:border-orange-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                                placeholder="Tell us more about your experience..."
                            ></textarea>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={handleRatingSubmit} className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
                                Submit Review
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            
            <SuccessModal
                show={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Thank You!"
                message="Your review has been submitted successfully."
                buttonText="Close"
                onButtonClick={() => setShowSuccessModal(false)}
            />
        </div>
    );
};

export default DashboardPage;
