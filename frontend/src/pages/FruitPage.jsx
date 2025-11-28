import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import Header from '../components/Header';
import Rating from '../components/Rating';
import { RestaurantListSkeleton } from '../components/RestaurantCardSkeleton';
import { EmptyRestaurants, EmptyMenuItems } from '../components/EmptyState';
import { SkeletonBox } from '../components/Skeleton';
import './RestaurantPage.css';
// Using the same background or a new one if provided
// For now, let's use a fruit-themed background placeholder or style
import fruitBackground from '../assets/images/fruit-background.jpg';

const CountdownTimer = ({ closingTime }) => {
    // ... (Same as RestaurantPage)
    // Duplicated logic for now, ideally move to utils/components
    const calculateTimeLeft = () => {
        if (!closingTime) return { hours: 0, minutes: 0, seconds: 0 };
        const [hours, minutes] = closingTime.split(':');
        const now = new Date();
        const deadline = new Date();
        deadline.setHours(hours, minutes, 0, 0);

        if (now > deadline) {
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
        <div className="bg-green-600 text-white text-center p-3 font-semibold shadow-lg">
            Fresh Fruits ordering closes in: {timerComponents.length ? timerComponents : <span>Time's up!</span>}
        </div>
    );
};


function FruitPage() {
    const [fruitStalls, setFruitStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const { addToCart, increaseQuantity, decreaseQuantity, cartItems } = useCart();
    const { isLoggedIn } = useAuth();
    const { settings, isLoadingSettings } = useSettings();
    const { showSuccess, showWarning } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFruitStalls = async () => {
            try {
                // Fetch specifically fruit_stall type
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/restaurants?type=fruit_stall`);
                setFruitStalls(data.data);
            } catch (err) {
                setError('Failed to fetch fruit stalls.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFruitStalls();
    }, []);

    const openStall = (stall) => {
        setSelectedStall(stall);
        setSearchQuery('');
        if (stall.menu && stall.menu.length > 0) {
            setActiveCategory(stall.menu[0].category);
        }
    };

    const goBack = () => {
        setSelectedStall(null);
        setSearchQuery('');
    };

    // Filter menu items
    const getFilteredItems = () => {
        if (!selectedStall || !selectedStall.menu) return [];
        
        if (!searchQuery.trim()) {
            const activeMenuCategory = selectedStall.menu.find(m => m.category === activeCategory);
            if (!activeMenuCategory) return [];
            return activeMenuCategory.items || [];
        }
        
        const query = searchQuery.toLowerCase().trim();
        const allFilteredItems = [];
        
        selectedStall.menu.forEach(category => {
            if (category.items && category.items.length > 0) {
                const filteredItems = category.items.filter(item => 
                    item.name.toLowerCase().includes(query)
                );
                filteredItems.forEach(item => {
                    allFilteredItems.push({
                        ...item,
                        category: category.category
                    });
                });
            }
        });
        return allFilteredItems;
    };

    const handleAddToCart = (item, stall) => {
        if (!isLoggedIn) {
            setIsLoginModalOpen(true);
            return;
        }
        if (!settings.isOrderingEnabled) {
            showWarning('We are currently closed. Please check back later.');
            return;
        }
        if (stall.isAcceptingOrders === false) {
            showWarning('This stall is currently not accepting orders.');
            return;
        }
        const existingItem = cartItems.find(x => x.name === item.name);
        addToCart(item, { id: stall._id, name: stall.name, type: stall.type });
        if (existingItem) {
            showSuccess(`${item.name} quantity updated!`);
        } else {
            showSuccess(`${item.name} added to cart!`);
        }
    };

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
        <div className="bg-green-50 min-h-screen" style={{ 
            backgroundImage: `url(${fruitBackground})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
        }}>
            <div className="fixed inset-0 bg-black bg-opacity-30 z-0"></div>
            
            <Header />
            <NotAcceptingOrdersBanner />
            { !isLoadingSettings && settings.isOrderingEnabled && <CountdownTimer closingTime={settings.orderClosingTime} /> }

            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                
                {loading ? (
                    <div className="fade-in">
                         <div className="mb-8 text-center">
                            <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Fresh Fruit Stalls</h2>
                            <p className="text-green-100 text-lg drop-shadow-md">Healthy & Fresh Fruits Delivered to You</p>
                        </div>
                        <RestaurantListSkeleton count={3} />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-800 bg-opacity-50 p-6 rounded-lg">
                        <h2 className="text-3xl font-bold text-white">Oops! Something went wrong.</h2>
                        <p className="text-red-200 mt-2">{error}</p>
                    </div>
                ) : !selectedStall ? (
                    <div id="fruitStallList" className="fade-in">
                         <div className="mb-8 text-center">
                             <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Fresh Fruit Stalls</h2>
                             <p className="text-green-100 text-lg drop-shadow-md">Healthy & Fresh Fruits Delivered to You</p>
                             <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-yellow-400 mx-auto mt-4 rounded-full"></div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {fruitStalls.length > 0 ? (
                                 fruitStalls.map(stall => (
                                 <div key={stall._id} onClick={() => openStall(stall)} className={`restaurant-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition hover:scale-105 ${(!settings.isOrderingEnabled || stall.isAcceptingOrders === false) ? 'opacity-75 relative' : ''}`}>
                                     {!settings.isOrderingEnabled && (
                                         <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">Closed</div>
                                     )}
                                     {settings.isOrderingEnabled && stall.isAcceptingOrders === false && (
                                         <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">Not Accepting</div>
                                     )}
                                     {stall.imageUrl ? (
                                        <img src={stall.imageUrl} alt={stall.name} className="h-48 w-full object-cover" />
                                     ) : (
                                        <div className="h-48 bg-gradient-to-br from-green-200 via-yellow-200 to-orange-200 flex items-center justify-center">
                                            <span className="text-6xl">🍎</span>
                                        </div>
                                     )}
                                     
                                     <div className="p-6">
                                         <div className="mb-3">
                                             <div className="flex items-center gap-2">
                                                 <h3 className="text-xl font-bold text-gray-900">{stall.name}</h3>
                                                 {!settings.isOrderingEnabled && (
                                                     <span className="text-red-500 text-xs">⚠️</span>
                                                 )}
                                                 {settings.isOrderingEnabled && stall.isAcceptingOrders === false && (
                                                     <span className="text-orange-500 text-xs">⚠️</span>
                                                 )}
                                             </div>
                                             <p className="text-gray-600">Fresh Fruits & Juices</p>
                                         </div>
                                         
                                         <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                             <Rating value={stall.averageRating} text={`${stall.numberOfReviews} reviews`} />
                                             <span className="flex items-center">
                                                 <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 {stall.deliveryTime}
                                             </span>
                                         </div>
                                     </div>
                                 </div>
                                 ))
                             ) : (
                                 <div className="col-span-full text-center text-white py-12">
                                     <p className="text-xl">No fruit stalls available at the moment.</p>
                                 </div>
                             )}
                         </div>
                     </div>
                ) : (
                    <div id="stallMenu">
                        {!settings.isOrderingEnabled && (
                            <div className="mb-4 bg-red-600 text-white text-center p-3 font-semibold shadow-lg rounded-lg">
                                ⚠️ Closed. No orders are being accepted.
                            </div>
                        )}
                        {settings.isOrderingEnabled && selectedStall?.isAcceptingOrders === false && (
                            <div className="mb-4 bg-orange-600 text-white text-center p-3 font-semibold shadow-lg rounded-lg">
                                ⚠️ This stall is currently not accepting orders
                            </div>
                        )}
                        <div className="flex items-center mb-6">
                            <button onClick={goBack} className="mr-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors bg-white bg-opacity-10">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-bold text-white drop-shadow-lg">{selectedStall.name}</h2>
                                    {!settings.isOrderingEnabled && (
                                        <span className="text-red-300 text-sm">⚠️ Closed</span>
                                    )}
                                    {settings.isOrderingEnabled && selectedStall?.isAcceptingOrders === false && (
                                        <span className="text-orange-300 text-sm">⚠️ Not Accepting</span>
                                    )}
                                </div>
                                <div className="flex items-center text-sm text-gray-200 mt-1">
                                    <Rating value={selectedStall.averageRating} text={`${selectedStall.numberOfReviews} reviews`} />
                                    <span className="mx-2">·</span>
                                    <span>{selectedStall.deliveryTime} delivery</span>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for fruits..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                                />
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">✕</button>
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-2 mb-8 overflow-x-auto">
                            {selectedStall.menu.map(menuItem => (
                                <button 
                                    key={menuItem.category}
                                    onClick={() => {
                                        setActiveCategory(menuItem.category);
                                        setSearchQuery('');
                                    }} 
                                    className={`category-tab px-6 py-3 rounded-full font-medium whitespace-nowrap ${activeCategory === menuItem.category ? 'bg-green-500 text-white shadow-lg transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {menuItem.category}
                                </button>
                            ))}
                        </div>

                        <div id="menuItems">
                            {getFilteredItems().length > 0 ? (
                                (() => {
                                    const groupedItems = searchQuery.trim() 
                                        ? getFilteredItems().reduce((acc, item) => {
                                            const category = item.category || 'Other';
                                            if (!acc[category]) acc[category] = [];
                                            acc[category].push(item);
                                            return acc;
                                          }, {})
                                        : { [activeCategory]: getFilteredItems() };
                                    
                                    return Object.entries(groupedItems).map(([category, items]) => (
                                        <div key={category}>
                                            {searchQuery.trim() && (
                                                <h3 className="text-lg font-semibold text-white mb-3 mt-4 capitalize">{category}</h3>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {items.map(item => (
                                                <div key={`${category}-${item.name}`} className="menu-item-card bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 hover:shadow-md transition">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h4>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="font-bold text-lg text-green-700">₹{item.price}</span>
                                                                
                                                                {getItemQuantity(item.name) === 0 ? (
                                                                    <button 
                                                                        onClick={() => handleAddToCart(item, selectedStall)} 
                                                                        className="bg-green-50 text-green-700 border border-green-200 px-4 py-1 rounded-full text-sm font-bold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        disabled={!settings.isOrderingEnabled || isLoadingSettings || selectedStall?.isAcceptingOrders === false}
                                                                    >
                                                                        {!settings.isOrderingEnabled 
                                                                            ? 'CLOSED' 
                                                                            : selectedStall?.isAcceptingOrders === false 
                                                                                ? 'NOT ACCEPTING' 
                                                                                : 'ADD'}
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center border border-green-200 rounded-full bg-green-50">
                                                                        <button 
                                                                            onClick={() => decreaseQuantity(item.name)} 
                                                                            className="px-3 py-1 text-green-700 font-bold hover:bg-green-100 rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings || (settings.isOrderingEnabled && selectedStall?.isAcceptingOrders === false)}
                                                                        >-</button>
                                                                        <span className="px-2 font-bold text-gray-800">{getItemQuantity(item.name)}</span>
                                                                        <button 
                                                                            onClick={() => increaseQuantity(item.name)} 
                                                                            className="px-3 py-1 text-green-700 font-bold hover:bg-green-100 rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings || (settings.isOrderingEnabled && selectedStall?.isAcceptingOrders === false)}
                                                                        >+</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover ml-3" />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center ml-3">
                                                                <span className="text-2xl">🍎</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    ));
                                })()
                            ) : (
                                <EmptyMenuItems 
                                    searchQuery={searchQuery} 
                                    onClearSearch={() => setSearchQuery('')} 
                                    className="empty-state-white"
                                />
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Modal show={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login Required">
                <div className="p-6 text-center">
                    <p>You need to be logged in to add items to the cart.</p>
                    <button onClick={() => navigate('/login')} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
                        Go to Login
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default FruitPage;
