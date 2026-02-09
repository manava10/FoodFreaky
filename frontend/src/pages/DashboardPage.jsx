import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import SuccessModal from '../components/SuccessModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import Rating from '../components/Rating'; // Assuming you have a Rating component
import { OrderListSkeleton } from '../components/OrderCardSkeleton';
import { DashboardWelcomeSkeleton } from '../components/DashboardSkeleton';
import { EmptyOrders } from '../components/EmptyState';
import './DashboardPage.css';
import foodBackground from '../assets/images/food-background.jpg';

const DashboardPage = () => {
    const { user, authToken } = useAuth();
    const { showError, showWarning, showSuccess } = useToast();
    const { addToCart, clearCart, cartItems } = useCart();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const config = {
                    headers: { Authorization: `Bearer ${authToken}` },
                };
                // Build query params with pagination and filters
                const params = new URLSearchParams();
                if (statusFilter) params.append('status', statusFilter);
                if (dateFilter) {
                    const [start, end] = dateFilter.split(' to ');
                    if (start) params.append('startDate', start);
                    if (end) params.append('endDate', end);
                }
                params.append('page', currentPage);
                params.append('limit', 20); // Fetch 20 orders per page
                
                const queryString = params.toString();
                const url = `${process.env.REACT_APP_API_URL}/api/orders/myorders${queryString ? '?' + queryString : ''}`;
                const { data } = await axios.get(url, config);
                setOrders(data.data || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchOrders();
        }
    }, [authToken, statusFilter, dateFilter, currentPage]);
    
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
            showWarning('Please select a rating.');
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
            showError(errorMsg);
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
            showError(errorMsg);
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
            showError('Could not download the invoice. Please try again later.');
        }
    };

    const successfulOrders = orders.filter(order => order.status === 'Delivered');
    const totalSpent = successfulOrders.reduce((acc, order) => acc + order.totalPrice, 0);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return 'status-delivered';
            case 'waiting for acceptance':
                return 'status-waiting';
            case 'accepted':
                return 'status-accepted';
            case 'preparing food':
                return 'status-preparing';
            case 'out for delivery':
                return 'status-delivery';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return '✓';
            case 'waiting for acceptance':
                return '⏳';
            case 'accepted':
                return '✓';
            case 'preparing food':
                return '👨‍🍳';
            case 'out for delivery':
                return '🚚';
            case 'cancelled':
                return '✕';
            default:
                return '•';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-950" style={{ backgroundImage: `url(${foodBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div className="fixed inset-0 bg-black bg-opacity-70 dark:bg-opacity-80 z-0"></div>
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {loading ? (
                    <>
                        <DashboardWelcomeSkeleton />
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-white mb-4">Your Orders</h2>
                            <OrderListSkeleton count={3} />
                        </div>
                    </>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white">Recent Orders</h2>
                        
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 min-h-[44px] text-base"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 min-h-[44px] text-base"
                            >
                                <option value="">All Status</option>
                                <option value="Waiting for Acceptance">Waiting</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Preparing Food">Preparing</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            {(statusFilter || dateFilter || searchQuery) && (
                                <button
                                    onClick={() => {
                                        setStatusFilter('');
                                        setDateFilter('');
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg min-h-[44px] text-base"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {(() => {
                        let filteredOrders = orders;
                        
                        // Apply search filter
                        if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            filteredOrders = filteredOrders.filter(order => 
                                order.restaurant?.name?.toLowerCase().includes(query) ||
                                (order.items || []).some(item => item.name.toLowerCase().includes(query)) ||
                                order._id.toLowerCase().includes(query)
                            );
                        }
                        
                        // Apply status filter
                        if (statusFilter) {
                            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
                        }
                        
                        return filteredOrders.length === 0 ? (
                            <EmptyOrders 
                                onBrowseRestaurants={() => navigate('/restaurants')}
                                className="empty-state-transparent"
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredOrders.map(order => (
                            <div key={order._id} className="order-card-modern bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors" onClick={() => viewOrderDetails(order)}>
                                                Order #{order._id.substring(0, 8)}
                                            </h4>
                                            <span className={`status-badge-modern ${getStatusClass(order.status)}`}>
                                                <span className="status-icon">{getStatusIcon(order.status)}</span>
                                                <span className="status-text">{order.status}</span>
                                            </span>
                                        </div>
                                        <p className="font-semibold text-orange-600 dark:text-orange-400 text-base mb-1">
                                            {order.restaurant ? order.restaurant.name : 'Restaurant'}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors" onClick={() => viewOrderDetails(order)}>
                                            {order.items && order.items.length > 0 ? (
                                                <>
                                                    {order.items.slice(0, 2).map(i => i.name).join(', ')}
                                                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                                                </>
                                            ) : 'No items'}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                                            {new Date(order.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end sm:items-end justify-between sm:justify-start gap-2">
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            ₹{order.totalPrice.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="order-actions-modern mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            {order.status === 'Waiting for Acceptance' && (
                                                    <button 
                                                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px] transition-colors dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                                        onClick={() => handleCancelOrder(order._id)}
                                                    >
                                                        Cancel Order
                                                    </button>
                                            )}
                                            {order.status === 'Delivered' && !order.rating && (
                                                <button 
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px] transition-colors dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 flex items-center gap-2"
                                                    onClick={() => openRatingModal(order)}
                                                >
                                                    <span>⭐</span>
                                                    <span>Rate Order</span>
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && order.rating && (
                                                <div className="flex items-center gap-2">
                                                    <Rating value={order.rating} />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Rated</span>
                                                </div>
                                            )}
                                            {order.status === 'Delivered' && (
                                                <button 
                                                    className="order-again-btn"
                                                    onClick={async () => {
                                                        try {
                                                            const config = {
                                                                headers: { Authorization: `Bearer ${authToken}` },
                                                            };
                                                            const { data } = await axios.get(
                                                                `${process.env.REACT_APP_API_URL}/api/orders/${order._id}/reorder`,
                                                                config
                                                            );
                                                            
                                                            if (data.success && data.data) {
                                                                const restaurant = data.data.restaurant;
                                                                
                                                                // Validate restaurant data
                                                                if (!restaurant || !restaurant.id || !restaurant.name) {
                                                                    showError('Invalid restaurant data. Cannot reorder.');
                                                                    return;
                                                                }
                                                                
                                                                // Validate items data
                                                                if (!data.data.items || !Array.isArray(data.data.items) || data.data.items.length === 0) {
                                                                    showError('No items found in this order.');
                                                                    return;
                                                                }
                                                                
                                                                // Helper function to add items to cart
                                                                const addReorderItemsToCart = (items, rest) => {
                                                                    items.forEach(item => {
                                                                        if (item.name && item.price && item.quantity) {
                                                                            for (let i = 0; i < item.quantity; i++) {
                                                                                addToCart(
                                                                                    { name: item.name, price: item.price },
                                                                                    { 
                                                                                        id: rest.id, 
                                                                                        name: rest.name,
                                                                                        type: rest.type || 'restaurant'
                                                                                    }
                                                                                );
                                                                            }
                                                                        }
                                                                    });
                                                                    showSuccess('Items added to cart! Redirecting...');
                                                                    setTimeout(() => navigate('/restaurants'), 1000);
                                                                };
                                                                
                                                                // Check if cart has items from a different restaurant
                                                                const currentCartRestaurant = cartItems.length > 0 && cartItems[0]?.restaurant?.id ? cartItems[0].restaurant.id : null;
                                                                const isDifferentRestaurant = currentCartRestaurant && currentCartRestaurant !== restaurant.id;
                                                                
                                                                if (isDifferentRestaurant) {
                                                                    // Show confirmation before clearing cart
                                                                    if (window.confirm(`Your cart has items from a different restaurant. Do you want to clear your cart and add items from ${restaurant.name}?`)) {
                                                                        clearCart();
                                                                        // Wait for cart to clear, then add new items
                                                                        setTimeout(() => {
                                                                            addReorderItemsToCart(data.data.items, restaurant);
                                                                        }, 150);
                                                                    }
                                                                } else {
                                                                    // Same restaurant or empty cart - just clear and add
                                                                    clearCart();
                                                                    setTimeout(() => {
                                                                        addReorderItemsToCart(data.data.items, restaurant);
                                                                    }, 150);
                                                                }
                                                            }
                                                        } catch (error) {
                                                            showError(error.response?.data?.msg || 'Failed to reorder');
                                                        }
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                                    </svg>
                                                    <span>Order Again</span>
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && (
                                                    <button 
                                                        className="download-bill-btn"
                                                        onClick={() => handleDownloadInvoice(order._id)}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                        </svg>
                                                        <span>Download Bill</span>
                                                    </button>
                                            )}
                                </div>
                            </div>
                                ))}
                            </div>
                        );
                    })()}
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
                        {(selectedOrder.items || []).map(item => (
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
