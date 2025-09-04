import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, authToken } = useAuth();
    const navigate = useNavigate();

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const handleApplyCoupon = () => {
        const code = couponCode.toUpperCase();
        if (code === 'FREAKY50') {
            setDiscount(cartTotal * 0.5);
            alert('Coupon applied! 50% discount.');
        } else if (code === 'MANAV') {
            setDiscount(cartTotal * 0.1);
            alert('Coupon applied! 10% discount.');
        } else {
            alert('Invalid coupon code.');
        }
    };
    
    const subtotal = cartTotal;
    const taxes = subtotal * 0.1; // Dummy 10% tax
    const finalTotal = subtotal + taxes - discount;

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        const order = {
            items: cartItems,
            totalPrice: finalTotal,
        };

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            };
            await axios.post('http://localhost:5001/api/orders', order, config);
            alert('Order placed successfully!');
            clearCart();
            navigate('/dashboard');
        } catch (error) {
            console.error('Order placement error:', error);
            alert('Failed to place order.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (!user) {
        return <p>Loading...</p>;
    }
    
    return (
        <div className="checkout-page-container">
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Checkout</h1>
                <div className="checkout-grid">
                    {/* Left Column: Details */}
                    <div className="checkout-details">
                        <div className="detail-card">
                            <h2 className="card-title">Delivery Information</h2>
                            <p><strong>Name:</strong> {user.name}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p className="mt-2 text-sm text-gray-500">Address functionality coming soon.</p>
                        </div>
                        <div className="detail-card">
                            <h2 className="card-title">Payment Method</h2>
                            <p className="text-sm text-gray-500">Payment integration coming soon. Click "Place Order" to complete your purchase for now.</p>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="order-summary">
                        <h2 className="card-title">Your Order</h2>
                        <div className="order-items">
                            {cartItems.map(item => (
                                <div key={item.name} className="summary-item">
                                    <span>{item.name} (x{item.quantity})</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="coupon-section">
                            <input 
                                type="text" 
                                placeholder="Enter coupon code" 
                                className="coupon-input"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                            />
                            <button onClick={handleApplyCoupon} className="coupon-btn">Apply</button>
                        </div>
                        <div className="price-details">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                                <span>Taxes & Fees</span>
                                <span>₹{taxes.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="price-row discount">
                                    <span>Discount</span>
                                    <span>-₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="price-row total">
                                <span>Total</span>
                                <span>₹{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handlePlaceOrder} 
                            className="place-order-btn"
                            disabled={isPlacingOrder || cartItems.length === 0}
                        >
                            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
