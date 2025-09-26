import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import Header from '../components/Header';
import Rating from '../components/Rating'; // Import the Rating component
import './RestaurantPage.css';
import foodBackground from '../assets/images/food-background.jpg';

const CountdownTimer = ({ closingTime }) => {
    const calculateTimeLeft = () => {
        const [hours, minutes] = closingTime.split(':');
        const now = new Date();
        const deadline = new Date();
        deadline.setHours(hours, minutes, 0, 0);

        if (now > deadline) {
            // If past closing time, maybe show "Closed" or calculate for next day
            return { hours: 0, minutes: 0, seconds: 0 };
        }

        const difference = deadline - now;
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = [];
    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && interval !== 'seconds' && timeLeft['hours'] === 0 && timeLeft['minutes'] < 10) {
            return;
        }
        timerComponents.push(
            <span key={interval}>
                {String(timeLeft[interval]).padStart(2, '0')}
                {interval[0]}{' '}
            </span>
        );
    });

    return (
        <div className="bg-red-600 text-white text-center p-3 font-semibold shadow-lg">
            Ordering closes in: {timerComponents.length ? timerComponents : <span>Time's up!</span>}
        </div>
    );
};


function RestaurantPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');
    
    const { addToCart, increaseQuantity, decreaseQuantity, cartItems } = useCart();
    const { isLoggedIn } = useAuth();
    const { settings, isLoadingSettings } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/restaurants`);
                setRestaurants(data.data);
            } catch (err) {
                setError('Failed to fetch restaurants.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurants();
    }, []);

    const openRestaurant = (restaurant) => {
        setSelectedRestaurant(restaurant);
        if (restaurant.menu && restaurant.menu.length > 0) {
            setActiveCategory(restaurant.menu[0].category);
        }
    };

    const goBack = () => {
        setSelectedRestaurant(null);
    };

    const handleAddToCart = (item, restaurant) => {
        if (!isLoggedIn) {
            setIsLoginModalOpen(true);
            return;
        }
        addToCart(item, { id: restaurant._id, name: restaurant.name });
    };

    // Helper to find the quantity of an item in the cart
    const getItemQuantity = (itemName) => {
        const itemInCart = cartItems.find(item => item.name === itemName);
        return itemInCart ? itemInCart.quantity : 0;
    };

    const NotAcceptingOrdersBanner = () => {
        if (isLoadingSettings || settings.isOrderingEnabled) {
            return null;
        }
        return (
            <div className="bg-red-600 text-white text-center p-3 font-semibold shadow-lg">
                We are currently not accepting orders. Please check back later.
            </div>
        );
    };
    
    return (
        <div className="bg-gray-50 min-h-screen" style={{ backgroundImage: `url(${foodBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div className="fixed inset-0 bg-black bg-opacity-40 z-0"></div>
            
            <Header />
            <NotAcceptingOrdersBanner />
            { !isLoadingSettings && settings.isOrderingEnabled && <CountdownTimer closingTime={settings.orderClosingTime} /> }

            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                
                {loading ? (
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold text-white">Loading Restaurants...</h2>
                        <p className="text-gray-300 mt-2">Finding the best food near you!</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-800 bg-opacity-50 p-6 rounded-lg">
                        <h2 className="text-3xl font-bold text-white">Oops! Something went wrong.</h2>
                        <p className="text-red-200 mt-2">{error}</p>
                    </div>
                ) : !selectedRestaurant ? (
                    <div id="restaurantList" className="fade-in">
                         <div className="mb-8 text-center">
                             <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Restaurants Near You</h2>
                             <p className="text-gray-200 text-lg drop-shadow-md">Discover amazing food from local restaurants</p>
                             <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-4 rounded-full"></div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {Array.isArray(restaurants) && restaurants.map(restaurant => (
                                 <div key={restaurant._id} onClick={() => openRestaurant(restaurant)} className="restaurant-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer">
                                     {restaurant.imageUrl ? (
                                        <img src={restaurant.imageUrl} alt={restaurant.name} className="h-48 w-full object-cover" />
                                     ) : (
                                        <div className="h-48 bg-gradient-to-br from-orange-200 via-red-200 to-yellow-200 flex items-center justify-center">
                                            <span className="text-6xl">🏛️</span>
                                        </div>
                                     )}
                                     
                                     <div className="p-6">
                                         <div className="mb-3">
                                             <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                                             <p className="text-gray-600">{restaurant.cuisine}</p>
                                         </div>
                                         
                                         <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                             <Rating value={restaurant.averageRating} text={`${restaurant.numberOfReviews} reviews`} />
                                             <span className="flex items-center">
                                                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 {restaurant.deliveryTime}
                                             </span>
                                         </div>
                                         
                                         <div className="flex flex-wrap gap-2">
                                             {restaurant.tags && restaurant.tags.map(tag => (
                                                 <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">{tag}</span>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                ) : (
                    <div id="restaurantMenu">
                        <div className="flex items-center mb-6">
                            <button onClick={goBack} className="mr-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors bg-white bg-opacity-10">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <div>
                                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{selectedRestaurant.name}</h2>
                                <div className="flex items-center text-sm text-gray-200 mt-1">
                                    <Rating value={selectedRestaurant.averageRating} text={`${selectedRestaurant.numberOfReviews} reviews`} />
                                    <span className="mx-2">·</span>
                                    <span>{selectedRestaurant.deliveryTime} delivery</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-2 mb-8 overflow-x-auto">
                            {selectedRestaurant.menu.map(menuItem => (
                                <button 
                                    key={menuItem.category}
                                    onClick={() => setActiveCategory(menuItem.category)} 
                                    className={`category-tab px-6 py-3 rounded-full font-medium whitespace-nowrap ${activeCategory === menuItem.category ? 'active' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {menuItem.category.charAt(0).toUpperCase() + menuItem.category.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div id="menuItems">
                            {selectedRestaurant.menu.find(m => m.category === activeCategory)?.items.map(item => (
                                <div key={item.name} className="menu-item-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h4>
                                            <p className="text-gray-600 text-sm mb-3">Delicious and fresh</p>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-lg text-gray-800">₹{item.price}</span>
                                                
                                                {getItemQuantity(item.name) === 0 ? (
                                                    <button 
                                                        onClick={() => handleAddToCart(item, selectedRestaurant)} 
                                                        className="add-to-cart-btn"
                                                        disabled={!settings.isOrderingEnabled || isLoadingSettings}
                                                    >
                                                        {settings.isOrderingEnabled ? 'ADD' : 'CLOSED'}
                                                    </button>
                                                ) : (
                                                    <div className="quantity-control">
                                                        <button 
                                                            onClick={() => decreaseQuantity(item.name)} 
                                                            className="quantity-btn"
                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings}
                                                        >-</button>
                                                        <span className="quantity-display">{getItemQuantity(item.name)}</span>
                                                        <button 
                                                            onClick={() => increaseQuantity(item.name)} 
                                                            className="quantity-btn"
                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings}
                                                        >+</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-24 h-24 bg-gray-200 rounded-lg object-cover ml-4" />
                                        ) : (
                                            <div className="w-24 h-24 bg-gradient-to-br from-white to-gray-100 rounded-lg flex items-center justify-center ml-4">
                                                <span className="text-2xl">{item.emoji || '🍕'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Modal show={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login Required">
                <div className="p-6 text-center">
                    <p>You need to be logged in to add items to the cart.</p>
                    <button onClick={() => navigate('/login')} className="go-to-login-btn">
                        Go to Login
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default RestaurantPage;