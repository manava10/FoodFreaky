import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, authToken } = useAuth();
    const { isOrderingEnabled, isLoadingSettings } = useSettings();
    const navigate = useNavigate();

    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCouponCode, setAppliedCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [couponSuccess, setCouponSuccess] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    useEffect(() => {
        if (user && user.contactNumber) {
            setContactNumber(user.contactNumber);
        }
    }, [user]);

    // Recalculate discount if cart total changes
    useEffect(() => {
        if (appliedCouponCode) {
            handleApplyCoupon(true); // Pass flag to indicate recalculation
        }
    }, [cartTotal]);

    const handleApplyCoupon = async (isRecalculation = false) => {
        const codeToValidate = isRecalculation ? appliedCouponCode : couponCode;
        if (!codeToValidate) {
            if (!isRecalculation) setCouponError('Please enter a coupon code.');
            return;
        }

        setCouponError('');
        // Don't reset discount if it's a recalculation
        if (!isRecalculation) {
            setDiscount(0);
        }

        setIsApplyingCoupon(true);
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/coupons/validate`, { code: codeToValidate });
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
            if (!isRecalculation) {
                setAppliedCouponCode(couponCode); // Store applied coupon
                setCouponCode(''); // Clear input
                setCouponSuccess(true); // Open success modal
            }

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to apply coupon.';
            setCouponError(errorMsg);
            // In case of an error during recalculation (e.g., coupon expired), remove it
            if (isRecalculation) {
                handleRemoveCoupon();
            }
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setDiscount(0);
        setCouponCode('');
        setAppliedCouponCode('');
        setCouponError('');
    };
    
    const subtotal = cartTotal;

    // Calculate dynamic service fee
    let serviceFee;
    if (subtotal < 500) {
        serviceFee = subtotal * 0.10; // 10%
    } else if (subtotal >= 500 && subtotal < 750) {
        serviceFee = subtotal * 0.08; // 8%
    } else if (subtotal >= 750 && subtotal < 1000) {
        serviceFee = subtotal * 0.065; // 6.5%
    } else { // 1000 and above
        serviceFee = subtotal * 0.05; // 5%
    }

    const deliveryCharge = 50;
    const finalTotal = subtotal + serviceFee + deliveryCharge - discount;

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
            taxPrice: serviceFee,
            shippingPrice: deliveryCharge,
            totalPrice: finalTotal,
            couponUsed: discount > 0 ? appliedCouponCode : null,
            restaurant: cartItems[0]?.restaurant?.id || null
        };

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            };
            await axios.post(`${process.env.REACT_APP_API_URL}/api/orders`, orderData, config);
            
            // Show custom success modal instead of alert
            setIsSuccessModalOpen(true);

        } catch (error) {
            console.error('Order placement error:', error);
            alert('Failed to place order.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center p-8 text-white">Loading...</div>;
    }

    if (!isOrderingEnabled) {
        return (
            <div className="checkout-page-container">
                <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Ordering Closed</h1>
                    <p className="text-xl mb-8">We are not currently accepting orders. Please check back later.</p>
                    <button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded">
                        Go to Homepage
                    </button>
                </main>
            </div>
        );
    }

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
                                <textarea id="address" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="Enter your Hostel Name, (e.g., MH1, LH2)"></textarea>
                            </div>
                        </div>
                        <div className="detail-card">
                            <h2 className="card-title">Payment Method</h2>
                            <p className="text-sm text-gray-500">Payment integration coming soon. Click "Place Order" to complete your purchase for now. All the payment will be taken during delivery either UPI/CASH.</p>
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
                            {discount > 0 ? (
                                <div className="applied-coupon">
                                    <p className='text-sm font-medium'>
                                        Coupon <span className='font-bold'>{appliedCouponCode}</span> applied!
                                    </p>
                                    <button onClick={handleRemoveCoupon} className="remove-coupon-btn">
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input 
                                        type="text" 
                                        placeholder="Enter coupon code" 
                                        className="coupon-input"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={isApplyingCoupon}
                                    />
                                    <button 
                                        onClick={() => handleApplyCoupon(false)} 
                                        className="coupon-btn"
                                        disabled={isApplyingCoupon || !couponCode}
                                    >
                                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                    </button>
                                </>
                            )}
                        </div>
                        {couponError && <p className="coupon-error">{couponError}</p>}
                        <div className="price-details">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                                <span>Delivery Charges</span>
                                <span>₹{deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                                <span>Service Fee</span>
                                <span>₹{serviceFee.toFixed(2)}</span>
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

            <SuccessModal
                show={isSuccessModalOpen}
                title="Order Placed!"
                message="Your order has been placed successfully. You can view its status on your dashboard."
                buttonText="Go to Dashboard"
                onButtonClick={() => {
                    setIsSuccessModalOpen(false);
                    clearCart();
                    navigate('/dashboard');
                }}
            />

            <SuccessModal
                show={couponSuccess}
                title="Coupon Applied!"
                message={`The coupon '${appliedCouponCode}' was applied successfully.`}
                buttonText="Awesome!"
                onButtonClick={() => setCouponSuccess(false)}
            />
        </div>
    );
};

export default CheckoutPage;
