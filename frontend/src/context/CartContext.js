import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const CartProviderContent = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('cartItems');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Could not parse cart data from localStorage", error);
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [clearCartConfirmation, setClearCartConfirmation] = useState({
        isOpen: false,
        item: null,
        restaurant: null,
    });
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item, restaurant) => {
        const isNewRestaurant = cartItems.length > 0 && cartItems[0].restaurant.id !== restaurant.id;

        if (isNewRestaurant) {
            setClearCartConfirmation({ isOpen: true, item, restaurant });
            return;
        }

        const exist = cartItems.find(x => x.name === item.name);

        setCartItems(prevItems => {
            if (exist) {
                return prevItems.map(x =>
                    x.name === item.name ? { ...exist, quantity: exist.quantity + 1 } : x
                );
            } else {
                return [...prevItems, { ...item, quantity: 1, restaurant: { id: restaurant.id, name: restaurant.name } }];
            }
        });
    };

    const handleConfirmClearCart = () => {
        const { item, restaurant } = clearCartConfirmation;
        setCartItems([{ ...item, quantity: 1, restaurant: { id: restaurant.id, name: restaurant.name } }]);
        setClearCartConfirmation({ isOpen: false, item: null, restaurant: null });
    };

    const handleCancelClearCart = () => {
        setClearCartConfirmation({ isOpen: false, item: null, restaurant: null });
    };

    const handleGoToCheckout = () => {
        setClearCartConfirmation({ isOpen: false, item: null, restaurant: null });
        closeCart();
        navigate('/checkout');
    };

    const updateQuantity = (name, quantity) => {
        setCartItems(prevItems => {
            if (quantity <= 0) {
                return prevItems.filter(x => x.name !== name);
            }
            return prevItems.map(x =>
                x.name === name ? { ...x, quantity } : x
            );
        });
    };

    const increaseQuantity = (itemName) => {
        const updatedCart = cartItems.map(item =>
            item.name === itemName ? { ...item, quantity: item.quantity + 1 } : item
        );
        setCartItems(updatedCart);
    };

    const decreaseQuantity = (itemName) => {
        const updatedCart = cartItems.map(item =>
            item.name === itemName ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        ).filter(item => item.quantity > 0);
        setCartItems(updatedCart);
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            isCartOpen,
            openCart,
            closeCart,
            increaseQuantity,
            decreaseQuantity
        }}>
            {children}
            {clearCartConfirmation.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content confirmation-modal">
                        <h3>Start a New Order?</h3>
                        <p>
                            Your cart contains items from <strong>{cartItems[0].restaurant.name}</strong>.
                            You can only order from one restaurant at a time.
                        </p>
                        <p>
                            Would you like to clear your cart to add this item from <strong>{clearCartConfirmation.restaurant.name}</strong>?
                        </p>
                        <div className="modal-actions">
                            <button onClick={handleGoToCheckout} className="checkout-confirm-btn">
                                Go to Checkout
                            </button>
                            <button onClick={handleConfirmClearCart} className="clear-cart-confirm-btn">
                                Clear Cart & Add
                            </button>
                            <button onClick={handleCancelClearCart} className="cancel-confirm-btn">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CartContext.Provider>
    );
};

export const CartProvider = ({ children }) => {
    return (
        <CartProviderContent>
            {children}
        </CartProviderContent>
    );
};
