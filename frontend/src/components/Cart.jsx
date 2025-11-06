import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { EmptyCart } from './EmptyState';
import './Cart.css';

const Cart = () => {
    const { cartItems, updateQuantity, cartTotal, isCartOpen, closeCart } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        closeCart();
        navigate('/checkout');
    };

    if (!isCartOpen) return null;

    return (
        <div className="cart-overlay" onClick={closeCart}>
            <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Your Cart</h2>
                    <button onClick={closeCart} className="close-cart-btn">&times;</button>
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
                                <p>{cartItems[0].restaurant.name}</p>
                            </div>
                            {cartItems.map(item => (
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
