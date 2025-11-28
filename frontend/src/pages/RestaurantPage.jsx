import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import Header from '../components/Header';
import Rating from '../components/Rating'; // Import the Rating component
import { RestaurantListSkeleton } from '../components/RestaurantCardSkeleton';
import { MenuItemListSkeleton } from '../components/MenuItemSkeleton';
import { SkeletonBox } from '../components/Skeleton';
import { EmptyRestaurants, EmptyMenuItems } from '../components/EmptyState';
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
    const [searchQuery, setSearchQuery] = useState('');
    
    // Restaurant filtering states
    const [restaurantSearch, setRestaurantSearch] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [minRating, setMinRating] = useState(0);
    const [maxDeliveryTime, setMaxDeliveryTime] = useState('');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'rating', 'deliveryTime'
    const [showFilters, setShowFilters] = useState(false);
    
    const { addToCart, increaseQuantity, decreaseQuantity, cartItems } = useCart();
    const { isLoggedIn } = useAuth();
    const { settings, isLoadingSettings } = useSettings();
    const { showSuccess, showWarning } = useToast();
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

    // Get unique cuisines and tags from restaurants
    const getUniqueCuisines = () => {
        const cuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];
        return cuisines.sort();
    };

    const getUniqueTags = () => {
        const allTags = restaurants.flatMap(r => r.tags || []).filter(Boolean);
        return [...new Set(allTags)].sort();
    };

    // Filter and sort restaurants
    const getFilteredRestaurants = () => {
        let filtered = [...restaurants];

        // Search by name
        if (restaurantSearch.trim()) {
            const search = restaurantSearch.toLowerCase().trim();
            filtered = filtered.filter(r => 
                r.name.toLowerCase().includes(search) ||
                (r.cuisine && r.cuisine.toLowerCase().includes(search))
            );
        }

        // Filter by cuisine
        if (selectedCuisine) {
            filtered = filtered.filter(r => r.cuisine === selectedCuisine);
        }

        // Filter by tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(r => 
                r.tags && r.tags.some(tag => selectedTags.includes(tag))
            );
        }

        // Filter by minimum rating
        if (minRating > 0) {
            filtered = filtered.filter(r => (r.averageRating || 0) >= minRating);
        }

        // Filter by delivery time
        if (maxDeliveryTime) {
            filtered = filtered.filter(r => {
                // Extract number from delivery time string (e.g., "30 min" -> 30, "45" -> 45)
                const timeMatch = r.deliveryTime?.match(/\d+/);
                const time = timeMatch ? parseInt(timeMatch[0]) : 999;
                const maxTime = parseInt(maxDeliveryTime);
                return time <= maxTime;
            });
        }

        // Sort restaurants
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.averageRating || 0) - (a.averageRating || 0);
                case 'deliveryTime':
                    const timeA = a.deliveryTime?.match(/\d+/)?.[0] ? parseInt(a.deliveryTime.match(/\d+/)[0]) : 999;
                    const timeB = b.deliveryTime?.match(/\d+/)?.[0] ? parseInt(b.deliveryTime.match(/\d+/)[0]) : 999;
                    return timeA - timeB;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setRestaurantSearch('');
        setSelectedCuisine('');
        setSelectedTags([]);
        setMinRating(0);
        setMaxDeliveryTime('');
        setSortBy('name');
    };

    const filteredRestaurants = getFilteredRestaurants();
    const activeFilterCount = (restaurantSearch ? 1 : 0) + 
                             (selectedCuisine ? 1 : 0) + 
                             selectedTags.length + 
                             (minRating > 0 ? 1 : 0) + 
                             (maxDeliveryTime ? 1 : 0);

    const openRestaurant = (restaurant) => {
        setSelectedRestaurant(restaurant);
        setSearchQuery(''); // Reset search when opening restaurant
        if (restaurant.menu && restaurant.menu.length > 0) {
            setActiveCategory(restaurant.menu[0].category);
        }
    };

    const goBack = () => {
        setSelectedRestaurant(null);
        setSearchQuery(''); // Reset search when going back
    };

    // Filter menu items based on search query - searches across all categories
    const getFilteredItems = () => {
        if (!selectedRestaurant || !selectedRestaurant.menu) return [];
        
        // If no search query, show items from active category only
        if (!searchQuery.trim()) {
            const activeMenuCategory = selectedRestaurant.menu.find(m => m.category === activeCategory);
            if (!activeMenuCategory) return [];
            return activeMenuCategory.items || [];
        }
        
        // If searching, search across all categories
        const query = searchQuery.toLowerCase().trim();
        const allFilteredItems = [];
        
        selectedRestaurant.menu.forEach(category => {
            if (category.items && category.items.length > 0) {
                const filteredItems = category.items.filter(item => 
                    item.name.toLowerCase().includes(query)
                );
                
                // Add category info to each item for display
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

    const handleAddToCart = (item, restaurant) => {
        if (!isLoggedIn) {
            setIsLoginModalOpen(true);
            return;
        }
        // First check: Global store setting (website closed)
        if (!settings.isOrderingEnabled) {
            showWarning('We are currently closed. Please check back later.');
            return;
        }
        // Second check: Individual restaurant accepting orders (only matters if website is open)
        if (restaurant.isAcceptingOrders === false) {
            showWarning('This restaurant is currently not accepting orders.');
            return;
        }
        const existingItem = cartItems.find(x => x.name === item.name);
        addToCart(item, { id: restaurant._id, name: restaurant.name, type: restaurant.type });
        if (existingItem) {
            showSuccess(`${item.name} quantity updated!`);
        } else {
            showSuccess(`${item.name} added to cart!`);
        }
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
                    <div className="fade-in">
                        <div className="mb-8 text-center">
                            <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Restaurants Near You</h2>
                            <p className="text-gray-200 text-lg drop-shadow-md">Discover amazing food from local restaurants</p>
                            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-4 rounded-full"></div>
                        </div>
                        {/* Filter Bar Skeleton */}
                        <div className="mb-6 bg-white bg-opacity-95 rounded-xl p-4 shadow-lg">
                            <SkeletonBox width="100%" height="48px" borderRadius="0.5rem" className="mb-4" />
                            <div className="flex items-center justify-between">
                                <SkeletonBox width="120px" height="40px" borderRadius="0.5rem" />
                                <SkeletonBox width="200px" height="40px" borderRadius="0.5rem" />
                            </div>
                        </div>
                        <RestaurantListSkeleton count={6} />
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

                         {/* Search and Filter Bar */}
                         <div className="mb-6 bg-white bg-opacity-95 rounded-xl p-4 shadow-lg">
                             {/* Search Bar */}
                             <div className="mb-4">
                                 <div className="relative">
                                     <input
                                         type="text"
                                         placeholder="Search restaurants by name or cuisine..."
                                         value={restaurantSearch}
                                         onChange={(e) => setRestaurantSearch(e.target.value)}
                                         className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                     />
                                     <svg 
                                         className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                                         fill="none" 
                                         stroke="currentColor" 
                                         viewBox="0 0 24 24"
                                     >
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                     </svg>
                                     {restaurantSearch && (
                                         <button
                                             onClick={() => setRestaurantSearch('')}
                                             className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                         >
                                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                             </svg>
                                         </button>
                                     )}
                                 </div>
                             </div>

                             {/* Filter Toggle Button */}
                             <div className="flex items-center justify-between mb-4">
                                 <button
                                     onClick={() => setShowFilters(!showFilters)}
                                     className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                 >
                                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                     </svg>
                                     Filters
                                     {activeFilterCount > 0 && (
                                         <span className="ml-2 bg-white text-orange-500 rounded-full px-2 py-0.5 text-xs font-bold">
                                             {activeFilterCount}
                                         </span>
                                     )}
                                 </button>

                                 {/* Sort Dropdown */}
                                 <div className="flex items-center">
                                     <label className="text-gray-700 mr-2 font-medium">Sort by:</label>
                                     <select
                                         value={sortBy}
                                         onChange={(e) => setSortBy(e.target.value)}
                                         className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                     >
                                         <option value="name">Name (A-Z)</option>
                                         <option value="rating">Highest Rated</option>
                                         <option value="deliveryTime">Fastest Delivery</option>
                                     </select>
                                 </div>

                                 {activeFilterCount > 0 && (
                                     <button
                                         onClick={clearFilters}
                                         className="ml-4 px-4 py-2 text-gray-600 hover:text-gray-800 underline"
                                     >
                                         Clear All
                                     </button>
                                 )}
                             </div>

                             {/* Filter Panel */}
                             {showFilters && (
                                 <div className="border-t border-gray-200 pt-4 space-y-4">
                                     {/* Cuisine Filter */}
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                                         <select
                                             value={selectedCuisine}
                                             onChange={(e) => setSelectedCuisine(e.target.value)}
                                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                         >
                                             <option value="">All Cuisines</option>
                                             {getUniqueCuisines().map(cuisine => (
                                                 <option key={cuisine} value={cuisine}>{cuisine}</option>
                                             ))}
                                         </select>
                                     </div>

                                     {/* Tags Filter */}
                                     {getUniqueTags().length > 0 && (
                                         <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                             <div className="flex flex-wrap gap-2">
                                                 {getUniqueTags().map(tag => (
                                                     <button
                                                         key={tag}
                                                         onClick={() => handleTagToggle(tag)}
                                                         className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                                             selectedTags.includes(tag)
                                                                 ? 'bg-orange-500 text-white'
                                                                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                         }`}
                                                     >
                                                         {tag}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                     )}

                                     {/* Rating Filter */}
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Minimum Rating: {minRating > 0 ? `${minRating}+ ⭐` : 'Any'}
                                         </label>
                                         <div className="flex items-center space-x-4">
                                             <input
                                                 type="range"
                                                 min="0"
                                                 max="5"
                                                 step="0.5"
                                                 value={minRating}
                                                 onChange={(e) => setMinRating(parseFloat(e.target.value))}
                                                 className="flex-1"
                                             />
                                             <span className="text-sm text-gray-600 w-20 text-right">
                                                 {minRating > 0 ? `${minRating}+ ⭐` : 'Any'}
                                             </span>
                                         </div>
                                     </div>

                                     {/* Delivery Time Filter */}
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">Max Delivery Time</label>
                                         <select
                                             value={maxDeliveryTime}
                                             onChange={(e) => setMaxDeliveryTime(e.target.value)}
                                             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                                         >
                                             <option value="">Any Time</option>
                                             <option value="15">15 minutes or less</option>
                                             <option value="30">30 minutes or less</option>
                                             <option value="45">45 minutes or less</option>
                                             <option value="60">60 minutes or less</option>
                                         </select>
                                     </div>
                                 </div>
                             )}

                             {/* Results Count */}
                             <div className="mt-4 pt-4 border-t border-gray-200">
                                 <p className="text-sm text-gray-600">
                                     Showing <span className="font-bold text-orange-600">{filteredRestaurants.length}</span> of <span className="font-bold">{restaurants.length}</span> restaurants
                                 </p>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {filteredRestaurants.length > 0 ? (
                                 filteredRestaurants.map(restaurant => (
                                 <div key={restaurant._id} onClick={() => openRestaurant(restaurant)} className={`restaurant-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer ${(!settings.isOrderingEnabled || restaurant.isAcceptingOrders === false) ? 'opacity-75 relative' : ''}`}>
                                     {!settings.isOrderingEnabled && (
                                         <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                                             Closed
                                         </div>
                                     )}
                                     {settings.isOrderingEnabled && restaurant.isAcceptingOrders === false && (
                                         <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                                             Not Accepting
                                         </div>
                                     )}
                                     {restaurant.imageUrl ? (
                                        <img src={restaurant.imageUrl} alt={restaurant.name} className="h-48 w-full object-cover" />
                                     ) : (
                                        <div className="h-48 bg-gradient-to-br from-orange-200 via-red-200 to-yellow-200 flex items-center justify-center">
                                            <span className="text-6xl">🏛️</span>
                                        </div>
                                     )}
                                     
                                     <div className="p-6">
                                         <div className="mb-3">
                                             <div className="flex items-center gap-2">
                                                 <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                                                 {!settings.isOrderingEnabled && (
                                                     <span className="text-red-500 text-xs">⚠️</span>
                                                 )}
                                                 {settings.isOrderingEnabled && restaurant.isAcceptingOrders === false && (
                                                     <span className="text-orange-500 text-xs">⚠️</span>
                                                 )}
                                             </div>
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
                                 ))
                             ) : (
                                 <div className="col-span-full">
                                     <EmptyRestaurants 
                                         onClearFilters={clearFilters}
                                         hasFilters={activeFilterCount > 0}
                                         className="empty-state-white-bg"
                                     />
                                 </div>
                             )}
                         </div>
                     </div>
                ) : (
                    <div id="restaurantMenu">
                        {!settings.isOrderingEnabled && (
                            <div className="mb-4 bg-red-600 text-white text-center p-3 font-semibold shadow-lg rounded-lg">
                                ⚠️ Closed. No orders are being accepted.
                            </div>
                        )}
                        {settings.isOrderingEnabled && selectedRestaurant?.isAcceptingOrders === false && (
                            <div className="mb-4 bg-orange-600 text-white text-center p-3 font-semibold shadow-lg rounded-lg">
                                ⚠️ This restaurant is currently not accepting orders
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
                                    <h2 className="text-3xl font-bold text-white drop-shadow-lg">{selectedRestaurant.name}</h2>
                                    {!settings.isOrderingEnabled && (
                                        <span className="text-red-300 text-sm">⚠️ Closed</span>
                                    )}
                                    {settings.isOrderingEnabled && selectedRestaurant?.isAcceptingOrders === false && (
                                        <span className="text-orange-300 text-sm">⚠️ Not Accepting</span>
                                    )}
                                </div>
                                <div className="flex items-center text-sm text-gray-200 mt-1">
                                    <Rating value={selectedRestaurant.averageRating} text={`${selectedRestaurant.numberOfReviews} reviews`} />
                                    <span className="mx-2">·</span>
                                    <span>{selectedRestaurant.deliveryTime} delivery</span>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search for food items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                                />
                                <svg 
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="text-white text-sm mt-2 drop-shadow-md">
                                    Found {getFilteredItems().length} item{getFilteredItems().length !== 1 ? 's' : ''} across all categories
                                </p>
                            )}
                        </div>

                        <div className="flex space-x-2 mb-8 overflow-x-auto">
                            {selectedRestaurant.menu.map(menuItem => (
                                <button 
                                    key={menuItem.category}
                                    onClick={() => {
                                        setActiveCategory(menuItem.category);
                                        setSearchQuery(''); // Reset search when changing category
                                    }} 
                                    className={`category-tab px-6 py-3 rounded-full font-medium whitespace-nowrap ${activeCategory === menuItem.category ? 'active' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {menuItem.category.charAt(0).toUpperCase() + menuItem.category.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div id="menuItems">
                            {getFilteredItems().length > 0 ? (
                                (() => {
                                    // Group items by category when searching
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
                                                <h3 className="text-lg font-semibold text-white mb-3 mt-4 first:mt-0 drop-shadow-md capitalize">
                                                    {category}
                                                </h3>
                                            )}
                                            {items.map(item => (
                                                <div key={`${category}-${item.name}`} className="menu-item-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h4>
                                                            <p className="text-gray-600 text-sm mb-3">Delicious and fresh</p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-lg text-gray-800">₹{item.price}</span>
                                                                
                                                                {getItemQuantity(item.name) === 0 ? (
                                                                    <button 
                                                                        onClick={() => handleAddToCart(item, selectedRestaurant)} 
                                                                        className="add-to-cart-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        disabled={!settings.isOrderingEnabled || isLoadingSettings || selectedRestaurant?.isAcceptingOrders === false}
                                                                    >
                                                                        {!settings.isOrderingEnabled 
                                                                            ? 'CLOSED' 
                                                                            : selectedRestaurant?.isAcceptingOrders === false 
                                                                                ? 'NOT ACCEPTING' 
                                                                                : 'ADD'}
                                                                    </button>
                                                                ) : (
                                                                    <div className="quantity-control">
                                                                        <button 
                                                                            onClick={() => decreaseQuantity(item.name)} 
                                                                            className="quantity-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings || (settings.isOrderingEnabled && selectedRestaurant?.isAcceptingOrders === false)}
                                                                        >-</button>
                                                                        <span className="quantity-display">{getItemQuantity(item.name)}</span>
                                                                        <button 
                                                                            onClick={() => increaseQuantity(item.name)} 
                                                                            className="quantity-btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            disabled={!settings.isOrderingEnabled || isLoadingSettings || (settings.isOrderingEnabled && selectedRestaurant?.isAcceptingOrders === false)}
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
                    <button onClick={() => navigate('/login')} className="go-to-login-btn">
                        Go to Login
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default RestaurantPage;