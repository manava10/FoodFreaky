import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { EmptyCart } from './EmptyState';
import './Cart.css';

const Cart = () => {
    const { cartItems, updateQuantity, cartTotal, isCartOpen, closeCart, clearCart } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        closeCart();
        navigate('/checkout');
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
            clearCart();
        }
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-overlay" onClick={closeCart}>
            <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Your Cart</h2>
                    <div className="cart-header-actions">
                        {cartItems.length > 0 && (
                            <button 
                                onClick={handleClearCart} 
                                className="clear-cart-header-btn"
                                title="Clear cart"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        )}
                        <button onClick={closeCart} className="close-cart-btn">&times;</button>
                    </div>
                </div>
                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <EmptyCart onBrowseRestaurants={() => {
                            closeCart();
                            navigate('/restaurants');
                        }} />
                    ) : (
                        <>
                            <div className="cart-restaurant-header">
                                <h3>Ordering from:</h3>
                                <p>{cartItems[0]?.restaurant?.name || 'Restaurant'}</p>
                            </div>
                            {(cartItems || []).map(item => (
                                <div key={item.name} className="cart-item">
                                    <div className="cart-item-info">
                                        <p className="item-name">{item.name}</p>
                                        <p className="item-price">₹{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="cart-item-controls">
                                        <button onClick={() => updateQuantity(item.name, item.quantity - 1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.name, item.quantity + 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
                <div className="cart-footer">
                    <div className="cart-total">
                        <strong>Total:</strong>
                        <strong>₹{cartTotal.toFixed(2)}</strong>
                    </div>
                    <button 
                        onClick={handleCheckout} 
                        className="checkout-btn" 
                        disabled={cartItems.length === 0}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
