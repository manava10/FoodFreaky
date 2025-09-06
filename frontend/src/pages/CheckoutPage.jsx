import React, { useState, useEffect } from 'react';
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

    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        if (user && user.contactNumber) {
            setContactNumber(user.contactNumber);
        }
    }, [user]);

    const handleApplyCoupon = async () => {
        setCouponError('');
        setDiscount(0);
        if (!couponCode) return;

        try {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/coupons/validate`, { code: couponCode });
            const coupon = data.data;

            let calculatedDiscount = 0;
            if (coupon.discountType === 'percentage') {
                calculatedDiscount = cartTotal * (coupon.value / 100);
            } else {
                calculatedDiscount = coupon.value;
            }

            if (calculatedDiscount > cartTotal) {
                calculatedDiscount = cartTotal;
            }

            setDiscount(calculatedDiscount);
            alert(`Coupon '${coupon.code}' applied successfully!`);

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to apply coupon.';
            setCouponError(errorMsg);
            alert(errorMsg); // Also show an alert for immediate feedback
        }
    };
    
    const subtotal = cartTotal;
    const taxes = subtotal * 0.1; // Dummy 10% tax
    const shipping = 50; // Dummy 50 shipping
    const finalTotal = subtotal + taxes + shipping - discount;

    const handlePlaceOrder = async () => {
        if (!address || !contactNumber) {
            alert('Please fill in your address and contact number.');
            return;
        }
        setIsPlacingOrder(true);
        const orderData = {
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
            shippingAddress: address,
            itemsPrice: subtotal,
            taxPrice: taxes,
            shippingPrice: shipping,
            totalPrice: finalTotal,
            couponUsed: discount > 0 ? couponCode : null
        };

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/api/orders`, orderData, config);
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
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" id="email" value={user?.email || ''} readOnly className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                            </div>
                            <div>
                                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
                                <input type="tel" id="contactNumber" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Shipping Address</label>
                                <textarea id="address" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="123 Main St, Anytown, USA"></textarea>
                            </div>
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
                        {couponError && <p className="coupon-error">{couponError}</p>}
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
