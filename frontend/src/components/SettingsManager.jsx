import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SettingsManager = () => {
    const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { authToken } = useAuth();

    const fetchSettings = useCallback(async () => {
        try {
            // This is a public endpoint, but we fetch on component load
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings/ordering`);
            setIsOrderingEnabled(data.isOrderingEnabled);
        } catch (err) {
            setError('Could not load store settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleToggleChange = async () => {
        const newValue = !isOrderingEnabled;
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/settings/ordering`, { isOrderingEnabled: newValue }, config);
            setIsOrderingEnabled(newValue);
        } catch (err) {
            setError('Failed to update settings. Please try again.');
            // Revert UI on failure
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div className="admin-management-card">
            <h3 className="card-title">Store Settings</h3>
            {loading ? (
                <p>Loading settings...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Accepting Orders</span>
                    <label htmlFor="ordering-toggle" className="inline-flex relative items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isOrderingEnabled}
                            onChange={handleToggleChange}
                            id="ordering-toggle"
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>
            )}
        </div>
    );
};

export default SettingsManager;
