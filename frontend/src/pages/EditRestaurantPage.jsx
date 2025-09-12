import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './AdminPage.css';
import Modal from '../components/Modal'; // Added Modal import

const EditRestaurantPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authToken } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        cuisine: '',
        address: '',
        deliveryTime: '',
        tags: '',
        imageUrl: ''
    });
    const [newMenuItem, setNewMenuItem] = useState({
        name: '',
        description: '', // Note: description is not in your MenuSchema, consider adding it
        price: '',
        category: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!authToken) return;
            try {
                const config = { headers: { Authorization: `Bearer ${authToken}` } };
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, config);
                setRestaurant(data.data);
                setFormData({
                    name: data.data.name,
                    cuisine: data.data.cuisine,
                    address: data.data.address,
                    deliveryTime: data.data.deliveryTime,
                    tags: data.data.tags.join(', '),
                    imageUrl: data.data.imageUrl
                });
            } catch (error) {
                console.error('Failed to fetch restaurant details', error);
                setError('Failed to fetch restaurant details.');
            } finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
    }, [id, authToken]);

    const handleOpenEditModal = (item) => {
        setCurrentItem(item);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentItem(null);
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } };
            await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}/menu/${currentItem._id}`, currentItem, config);
            
            // Refresh the restaurant data to show the update
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            setRestaurant(data.data);

            handleCloseEditModal();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update menu item.');
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleMenuChange = (e) => setNewMenuItem({ ...newMenuItem, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } };
        const body = { ...formData, tags: formData.tags.split(',').map(tag => tag.trim()) };
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, body, config);
            alert('Restaurant updated successfully!');
            navigate('/superadmin');
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to update restaurant.';
            setError(errorMsg);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        const { name, price, category, description, imageUrl } = newMenuItem;
        if (!name || !price || !category) {
            setError('Please fill in all menu item fields.');
            return;
        }

        const updatedRestaurant = { ...restaurant };
        const categoryIndex = updatedRestaurant.menu.findIndex(cat => cat.category.toLowerCase() === category.toLowerCase());
        
        const newItem = { name, price: Number(price), description, imageUrl }; // ensure price is a number

        if (categoryIndex > -1) {
            // Category exists, add item to it
            updatedRestaurant.menu[categoryIndex].items.push(newItem);
        } else {
            // New category, create it and add item
            updatedRestaurant.menu.push({ category, items: [newItem] });
        }
        
        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, { menu: updatedRestaurant.menu }, config);
            setRestaurant(data.data);
            setNewMenuItem({ name: '', description: '', price: '', category: '', imageUrl: '' }); // Reset form
            setError('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to add menu item.');
        }
    };

    const handleDeleteItem = async (categoryName, itemId) => {
        const updatedRestaurant = { ...restaurant };
        const categoryIndex = updatedRestaurant.menu.findIndex(cat => cat.category === categoryName);

        if (categoryIndex === -1) return; // Should not happen

        // Filter out the item to be deleted
        updatedRestaurant.menu[categoryIndex].items = updatedRestaurant.menu[categoryIndex].items.filter(item => item._id !== itemId);

        // If the category is now empty, remove the category itself
        if (updatedRestaurant.menu[categoryIndex].items.length === 0) {
            updatedRestaurant.menu = updatedRestaurant.menu.filter(cat => cat.category !== categoryName);
        }

        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/restaurants/${id}`, { menu: updatedRestaurant.menu }, config);
            setRestaurant(data.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete menu item.');
        }
    };

    if (loading) return <p className="text-white text-center">Loading restaurant...</p>;
    if (!restaurant) return <p className="text-white text-center">Restaurant not found.</p>;

    return (
        <div className="admin-page-container">
            <div className="fixed inset-0 bg-black bg-opacity-60 z-0"></div>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <button onClick={() => navigate('/superadmin')} className="back-to-admin-btn">&larr; Back to Super Admin</button>
                <h1 className="text-4xl font-bold text-white text-center mb-8">Edit {restaurant.name}</h1>

                <div className="admin-management-card edit-restaurant-form">
                    <h2 className="text-2xl font-bold text-white mb-6">Restaurant Details</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="admin-form-input" />
                            </div>
                            <div>
                                <label htmlFor="cuisine" className="block text-sm font-medium text-gray-300 mb-1">Cuisine</label>
                                <input type="text" name="cuisine" id="cuisine" value={formData.cuisine} onChange={handleChange} required className="admin-form-input" />
                            </div>
                             <div>
                                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-300 mb-1">Delivery Time (e.g., 25-35 min)</label>
                                <input type="text" name="deliveryTime" id="deliveryTime" value={formData.deliveryTime} onChange={handleChange} required className="admin-form-input" />
                            </div>
                             <div>
                                <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
                                <input type="text" name="tags" id="tags" value={formData.tags} onChange={handleChange} required className="admin-form-input" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="admin-form-input" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                                <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange} required className="admin-form-input" />
                            </div>
                        </div>
                        
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button type="submit" className="manage-btn w-full !opacity-100 !cursor-pointer hover:bg-orange-600 transition-colors">
                            Update Restaurant
                        </button>
                    </form>
                </div>

                <div className="admin-management-card edit-restaurant-form mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Manage Menu</h2>
                    
                    <form onSubmit={handleAddItem} className="space-y-4 mb-6 p-4 border border-gray-700 rounded-lg">
                        <h3 className="text-xl font-semibold text-white">Add New Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="name" placeholder="Item Name" value={newMenuItem.name} onChange={handleMenuChange} required className="admin-form-input" />
                            <input type="number" name="price" placeholder="Price" value={newMenuItem.price} onChange={handleMenuChange} required className="admin-form-input" />
                            <input type="text" name="category" placeholder="Category (e.g., Appetizers)" value={newMenuItem.category} onChange={handleMenuChange} required className="admin-form-input" />
                            <input type="text" name="imageUrl" placeholder="Image URL (optional)" value={newMenuItem.imageUrl} onChange={handleMenuChange} className="admin-form-input" />
                            <div className="md:col-span-2">
                                <input type="text" name="description" placeholder="Description (optional)" value={newMenuItem.description} onChange={handleMenuChange} className="admin-form-input" />
                            </div>
                        </div>
                        <button type="submit" className="manage-btn !opacity-100 !cursor-pointer hover:bg-blue-600 transition-colors">Add Item</button>
                    </form>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Current Menu</h3>
                        <div className="space-y-6">
                            {restaurant.menu && restaurant.menu.map(category => (
                                <div key={category._id || category.category}>
                                    <h4 className="text-lg font-bold text-orange-400 mb-2 border-b border-gray-600 pb-1">{category.category}</h4>
                                    <div className="space-y-3">
                                        {category.items.map(item => (
                                            <div key={item._id} className="flex items-start justify-between bg-gray-800 p-3 rounded-md">
                                                {item.imageUrl && (
                                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-md object-cover mr-4 flex-shrink-0" />
                                                )}
                                                <div className="flex-grow">
                                                    <p className="font-bold text-white">{item.name}</p>
                                                    {item.description && <p className="text-sm text-gray-400 mt-1">{item.description}</p>}
                                                </div>
                                                <div className="flex items-center flex-shrink-0 ml-4 text-right">
                                                    <p className="font-bold text-white mr-4">₹{item.price}</p>
                                                    <button onClick={() => handleOpenEditModal(item)} className="edit-btn text-lg mr-2">✏️</button>
                                                    <button onClick={() => handleDeleteItem(category.category, item._id)} className="delete-coupon-btn text-lg text-red-500 hover:text-red-400 transition-colors leading-none">&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {(!restaurant.menu || restaurant.menu.length === 0) && (
                                <p className="text-gray-400">No menu items yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {isEditModalOpen && currentItem && (
                <Modal show={isEditModalOpen} onClose={handleCloseEditModal} title={`Edit ${currentItem.name}`}>
                    <div className="p-6">
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    value={currentItem.name} 
                                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} 
                                    className="admin-form-input bg-white text-black" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input 
                                    type="number" 
                                    value={currentItem.price} 
                                    onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })} 
                                    className="admin-form-input bg-white text-black" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input 
                                    type="text" 
                                    value={currentItem.description} 
                                    onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })} 
                                    className="admin-form-input bg-white text-black" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input 
                                    type="text" 
                                    value={currentItem.imageUrl} 
                                    onChange={(e) => setCurrentItem({ ...currentItem, imageUrl: e.target.value })} 
                                    className="admin-form-input bg-white text-black" 
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={handleCloseEditModal} className="manage-btn bg-gray-300 hover:bg-gray-400">Cancel</button>
                                <button type="submit" className="manage-btn bg-blue-500 hover:bg-blue-600">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default EditRestaurantPage;
