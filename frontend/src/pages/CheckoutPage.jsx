import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import SuccessModal from '../components/SuccessModal';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, authToken } = useAuth();
    const { settings, isLoadingSettings } = useSettings();
    const { showError } = useToast();
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
    const [userCredits, setUserCredits] = useState(0);
    const [creditsToUse, setCreditsToUse] = useState(0);
    const [loadingCredits, setLoadingCredits] = useState(true);
    const isValidContactNumber = (value) => /^[0-9]{10}$/.test(value) && value !== '0000000000';

    useEffect(() => {
        if (user && user.contactNumber) {
            setContactNumber(user.contactNumber === '0000000000' ? '' : user.contactNumber);
        }
    }, [user]);

    // Fetch user credits
    useEffect(() => {
        const fetchCredits = async () => {
            if (!authToken) {
                setLoadingCredits(false);
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${authToken}` },
                };
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/credits`, config);
                setUserCredits(data.credits || 0);
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            } finally {
                setLoadingCredits(false);
            }
        };
        fetchCredits();
    }, [authToken]);

    const handleRemoveCoupon = useCallback(() => {
        setDiscount(0);
        setCouponCode('');
        setAppliedCouponCode('');
        setCouponError('');
    }, []);

    const handleApplyCoupon = useCallback(async (code, isRecalculation = false) => {
        const codeToValidate = code;
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
                setAppliedCouponCode(codeToValidate); // Store applied coupon
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
    }, [cartTotal, handleRemoveCoupon]);

    // Recalculate discount if cart total changes
    useEffect(() => {
        if (appliedCouponCode) {
            handleApplyCoupon(appliedCouponCode, true); // Pass flag to indicate recalculation
        }
    }, [cartTotal, appliedCouponCode, handleApplyCoupon]);
    
    const subtotal = cartTotal;
    const isFruitStall = cartItems.length > 0 && cartItems[0]?.restaurant?.type === 'fruit_stall';
    
    // Calculate dynamic Tax (Paid to restaurant)
    let taxAmount = 0;

    if (!isFruitStall) {
        if (subtotal < 500) {
            taxAmount = subtotal * 0.09; // 9%
        } else if (subtotal >= 500 && subtotal < 750) {
            taxAmount = subtotal * 0.085; // 8.5%
        } else if (subtotal >= 750 && subtotal < 1000) {
            taxAmount = subtotal * 0.075; // 7.5%
        } else { // 1000 and above
            taxAmount = subtotal * 0.0625; // 6.25%
        }
    }
    
    // Calculate Delivery Charge based on Restaurant Type
    let deliveryCharge = 50; // Default

    
    if (isFruitStall) {
        if (subtotal < 500) {
            deliveryCharge = 30;
        } else {
            deliveryCharge = 50;
        }
    }

    // Calculate max credits that can be used (5% of order value before credits)
    const orderValueBeforeCredits = subtotal + taxAmount + deliveryCharge - discount;
    const maxCreditsAllowed = Math.floor(orderValueBeforeCredits * 0.05); // Max 5% of order value
    const effectiveCreditsToUse = Math.min(creditsToUse, userCredits, maxCreditsAllowed);
    
    const finalTotal = Math.max(0, orderValueBeforeCredits - effectiveCreditsToUse);

    const handlePlaceOrder = async () => {
        const trimmedAddress = address.trim();
        const normalizedContactNumber = contactNumber.trim();

        if (!trimmedAddress || !normalizedContactNumber) {
            showError('Please fill in your address and contact number.');
            return;
        }

        if (!isValidContactNumber(normalizedContactNumber)) {
            showError('Please enter a valid 10-digit contact number (cannot be 0000000000).');
            return;
        }
        
        // Validate cart has items
        if (!cartItems || cartItems.length === 0) {
            showError('Your cart is empty. Please add items before placing an order.');
            return;
        }
        
        // Validate restaurant ID
        const restaurantId = cartItems[0]?.restaurant?.id;
        if (!restaurantId) {
            showError('Restaurant information is missing. Please clear your cart and try again.');
            console.error('Cart items:', cartItems);
            console.error('First cart item restaurant:', cartItems[0]?.restaurant);
            return;
        }
        
        // Ensure restaurant ID is a string (MongoDB ObjectIds are strings)
        const restaurantIdString = String(restaurantId);
        
        setIsPlacingOrder(true);
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
        };
        const orderData = {
            items: (cartItems || []).map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            })),
            shippingAddress: trimmedAddress,
            itemsPrice: subtotal,
            taxPrice: taxAmount,
            shippingPrice: deliveryCharge,
            totalPrice: finalTotal,
            couponUsed: discount > 0 ? appliedCouponCode : null,
            creditsUsed: effectiveCreditsToUse > 0 ? effectiveCreditsToUse : 0,
            restaurant: restaurantIdString
        };
        
        console.log('Placing order with data:', {
            ...orderData,
            itemsCount: orderData.items.length,
            restaurantId: restaurantIdString
        });

        try {
            const storedContactNumber = (user?.contactNumber || '').trim();
            const shouldUpdateProfileContact = !isValidContactNumber(storedContactNumber) || storedContactNumber !== normalizedContactNumber;

            // Ensure contact number is saved for Google sign-in users before placing order.
            if (shouldUpdateProfileContact) {
                await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/auth/profile`,
                    { contactNumber: normalizedContactNumber },
                    config
                );
            }

            await axios.post(`${process.env.REACT_APP_API_URL}/api/orders`, orderData, config);
            
            // Refresh credits if used
            if (effectiveCreditsToUse > 0) {
                try {
                    const creditsConfig = {
                        headers: { Authorization: `Bearer ${authToken}` },
                    };
                    const { data: creditsData } = await axios.get(`${process.env.REACT_APP_API_URL}/api/credits`, creditsConfig);
                    setUserCredits(creditsData.credits || 0);
                    setCreditsToUse(0);
                } catch (error) {
                    console.error('Failed to refresh credits:', error);
                }
            }
            
            // Show custom success modal instead of alert
            setIsSuccessModalOpen(true);

        } catch (error) {
            console.error('Order placement error:', error);
            
            // Check for validation errors from backend
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                // Multiple validation errors
                const errorMessages = error.response.data.errors.map(err => err.message || `${err.field}: ${err.message}`).join('. ');
                showError(errorMessages);
            } else if (error.response?.data?.msg) {
                // Single error message
                showError(error.response.data.msg);
            } else if (error.message) {
                // Network or other error
                showError(error.message);
            } else {
                // Fallback
                showError('Failed to place order. Please try again.');
            }
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (isLoadingSettings) {
        return <div className="text-center p-8 text-white">Loading...</div>;
    }

    if (!settings.isOrderingEnabled) {
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
        <div className="checkout-page-container dark:bg-gray-900">
            <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 z-0"></div>
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
                            {(cartItems || []).map(item => (
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
                                        onClick={() => handleApplyCoupon(couponCode, false)} 
                                        className="coupon-btn"
                                        disabled={isApplyingCoupon || !couponCode}
                                    >
                                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                    </button>
                                </>
                            )}
                        </div>
                        {couponError && <p className="coupon-error">{couponError}</p>}
                        
                        {/* FoodFreaky Credits Section */}
                        {!loadingCredits && userCredits > 0 && (
                            <div className="credits-section">
                                <div className="credits-info">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            🎁 FoodFreaky Credits Available
                                        </span>
                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                            ₹{userCredits}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Use up to 5% of order value (Max: ₹{maxCreditsAllowed})
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max={Math.min(userCredits, maxCreditsAllowed)}
                                            value={creditsToUse}
                                            onChange={(e) => {
                                                const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, Math.min(userCredits, maxCreditsAllowed)));
                                                setCreditsToUse(value);
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Enter credits to use"
                                        />
                                        <button
                                            onClick={() => setCreditsToUse(Math.min(userCredits, maxCreditsAllowed))}
                                            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Use Max
                                        </button>
                                        {creditsToUse > 0 && (
                                            <button
                                                onClick={() => setCreditsToUse(0)}
                                                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="price-details">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                                <span>Delivery Charges</span>
                                <span>₹{deliveryCharge.toFixed(2)}</span>
                            </div>
                            {taxAmount > 0 && (
                                <div className="price-row">
                                    <span>Tax (Paid to restaurant)</span>
                                    <span>₹{taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {discount > 0 && (
                                <div className="price-row discount">
                                    <span>Discount</span>
                                    <span>-₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            {effectiveCreditsToUse > 0 && (
                                <div className="price-row discount">
                                    <span>FoodFreaky Credits</span>
                                    <span>-₹{effectiveCreditsToUse.toFixed(2)}</span>
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
