import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RestaurantManager = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useAuth();
    
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
            // Public route, no auth needed
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/restaurants`);
            setRestaurants(data.data);
        } catch (error) {
            console.error('Failed to fetch restaurants', error);
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
            } catch (err) {
                alert('Failed to delete restaurant');
            }
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
                        <div>
                            <strong className="coupon-code">{restaurant.name}</strong>
                            <p>{restaurant.cuisine}</p>
                        </div>
                        <div>
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
