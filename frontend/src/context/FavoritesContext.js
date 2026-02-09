import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLoggedIn, authToken } = useAuth();
    const { showSuccess, showError } = useToast();

    // Fetch favorites when user logs in
    useEffect(() => {
        if (isLoggedIn && authToken) {
            fetchFavorites();
        } else {
            setFavorites([]);
            setLoading(false);
        }
    }, [isLoggedIn, authToken]);

    const fetchFavorites = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };
            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/favorites`,
                config
            );
            setFavorites(data.data || []);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToFavorites = async (restaurantId) => {
        if (!isLoggedIn) {
            showError('Please login to add favorites');
            return false;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/favorites/${restaurantId}`,
                {},
                config
            );
            setFavorites(data.data || []);
            showSuccess('Added to favorites!');
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to add to favorites';
            showError(errorMsg);
            return false;
        }
    };

    const removeFromFavorites = async (restaurantId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };
            const { data } = await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/favorites/${restaurantId}`,
                config
            );
            setFavorites(data.data || []);
            showSuccess('Removed from favorites');
            return true;
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Failed to remove from favorites';
            showError(errorMsg);
            return false;
        }
    };

    const toggleFavorite = async (restaurantId) => {
        const isFavorited = favorites.some(fav => fav._id === restaurantId);
        if (isFavorited) {
            return await removeFromFavorites(restaurantId);
        } else {
            return await addToFavorites(restaurantId);
        }
    };

    const isFavorited = (restaurantId) => {
        return favorites.some(fav => fav._id === restaurantId);
    };

    const value = {
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorited,
        fetchFavorites,
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
