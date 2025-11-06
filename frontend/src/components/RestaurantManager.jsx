import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const RestaurantManager = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useAuth();
    const { showError, showSuccess } = useToast();
    
    // Form state
    const [name, setName] = useState('');
    const [cuisine, setCuisine] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            // Use admin route to get all restaurants with accepting orders status
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/restaurants`, config);
            // If admin route doesn't exist, fallback to public route
            if (data.success && data.data) {
                setRestaurants(data.data);
            } else {
                const publicData = await axios.get(`${process.env.REACT_APP_API_URL}/api/restaurants`);
                setRestaurants(publicData.data.data);
            }
        } catch (error) {
            // Fallback to public route if admin route fails
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/restaurants`);
                setRestaurants(data.data);
            } catch (err) {
                console.error('Failed to fetch restaurants', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const newRestaurant = { 
                name, 
                cuisine, 
                deliveryTime, 
                tags: tags.split(',').map(tag => tag.trim()),
                menu: [] // Default with an empty menu
            };
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/restaurants`, newRestaurant, config);
            setRestaurants([data.data, ...restaurants]);
            // Clear form
            setName(''); setCuisine(''); setDeliveryTime(''); setTags('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create restaurant');
        }
    };

    const handleDeleteRestaurant = async (id) => {
        if (window.confirm('Are you sure you want to delete this restaurant? This is irreversible.')) {
            try {
                const config = { headers: { Authorization: `Bearer ${authToken}` } };
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, config);
                setRestaurants(restaurants.filter(r => r._id !== id));
                showSuccess('Restaurant deleted successfully!');
            } catch (err) {
                showError('Failed to delete restaurant.');
            }
        }
    };

    const handleToggleAcceptingOrders = async (id, currentStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}/accepting-orders`,
                {},
                config
            );
            
            // Update the restaurant in the list
            setRestaurants(restaurants.map(r => 
                r._id === id ? { ...r, isAcceptingOrders: data.data.isAcceptingOrders } : r
            ));
            
            showSuccess(data.message || 
                (data.data.isAcceptingOrders 
                    ? 'Restaurant is now accepting orders' 
                    : 'Restaurant is no longer accepting orders')
            );
        } catch (err) {
            showError('Failed to update restaurant status.');
            console.error(err);
        }
    };

    return (
        <div className="admin-management-card">
            <h3 className="card-title">Restaurant Management</h3>
            
            <form onSubmit={handleCreateRestaurant} className="coupon-form">
                <div className="form-grid">
                    <input type="text" placeholder="Restaurant Name" value={name} onChange={e => setName(e.target.value)} required />
                    <input type="text" placeholder="Cuisine (e.g., Italian)" value={cuisine} onChange={e => setCuisine(e.target.value)} required />
                    <input type="text" placeholder="Delivery Time (e.g., 25-35 min)" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} required />
                    <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
                <button type="submit" className="create-coupon-btn">Add Restaurant</button>
                {error && <p className="error-message">{error}</p>}
            </form>

            <div className="coupon-list">
                {loading ? <p>Loading restaurants...</p> : restaurants.map(restaurant => (
                    <div key={restaurant._id} className="coupon-item">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <strong className="coupon-code">{restaurant.name}</strong>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    restaurant.isAcceptingOrders !== false 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                }`}>
                                    {restaurant.isAcceptingOrders !== false ? 'Accepting Orders' : 'Not Accepting'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Note: Restaurant status only applies when website is open
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggleAcceptingOrders(restaurant._id, restaurant.isAcceptingOrders)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    restaurant.isAcceptingOrders !== false
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                                title={restaurant.isAcceptingOrders !== false ? 'Click to stop accepting orders' : 'Click to start accepting orders'}
                            >
                                {restaurant.isAcceptingOrders !== false ? 'Stop Orders' : 'Accept Orders'}
                            </button>
                            <button onClick={() => navigate(`/superadmin/restaurant/${restaurant._id}`)} className="edit-btn">Edit</button>
                            <button onClick={() => handleDeleteRestaurant(restaurant._id)} className="delete-coupon-btn">&times;</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantManager;
