import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import Rating from '../components/Rating';
import { EmptyRestaurants } from '../components/EmptyState';
import foodBackground from '../assets/images/food-background.jpg';

const FavoritesPage = () => {
    const { favorites, loading, toggleFavorite, isFavorited } = useFavorites();
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen relative" style={{ backgroundImage: `url(${foodBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
                <div className="fixed inset-0 bg-black bg-opacity-40 z-0"></div>
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 text-center">
                    <div className="bg-white bg-opacity-95 rounded-xl p-8 max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
                        <p className="text-gray-600 mb-6">Please login to view your favorite restaurants.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
                        >
                            Go to Login
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative" style={{ backgroundImage: `url(${foodBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div className="fixed inset-0 bg-black bg-opacity-40 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">My Favorite Restaurants</h2>
                    <p className="text-gray-200 text-base sm:text-lg drop-shadow-md">Your saved restaurants for quick access</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 mx-auto mt-4 rounded-full"></div>
                </div>

                {loading ? (
                    <div className="text-center text-white">
                        <p>Loading favorites...</p>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyRestaurants 
                            onClearFilters={() => navigate('/restaurants')}
                            hasFilters={false}
                            className="empty-state-white-bg"
                        />
                        <div className="text-center mt-6">
                            <button
                                onClick={() => navigate('/restaurants')}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                Browse Restaurants
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {favorites.map(restaurant => (
                            <div key={restaurant._id} className="restaurant-card bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer relative">
                                {/* Favorite Button */}
                                <button
                                    onClick={() => toggleFavorite(restaurant._id)}
                                    className="absolute top-3 right-3 z-20 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
                                    aria-label="Remove from favorites"
                                >
                                    <svg 
                                        className="w-5 h-5 text-red-500 fill-current"
                                        fill="currentColor"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                                
                                <div onClick={() => {
                                    // Store restaurant in sessionStorage to open it directly
                                    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
                                    navigate('/restaurants');
                                }}>
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
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FavoritesPage;
