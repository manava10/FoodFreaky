import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SettingsManager = () => {
    const [settings, setSettings] = useState({
        isOrderingEnabled: true,
        orderClosingTime: "22:00"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { authToken } = useAuth();

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings`);
            if (data.settings) {
                setSettings({
                    isOrderingEnabled: data.settings.isOrderingEnabled,
                    orderClosingTime: data.settings.orderClosingTime
                });
            }
        } catch (err) {
            setError('Could not load store settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveSettings = async (newSettings) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/settings`, newSettings, config);
            if (data.settings) {
                setSettings({
                    isOrderingEnabled: data.settings.isOrderingEnabled,
                    orderClosingTime: data.settings.orderClosingTime
                });
            }
        } catch (err) {
            setError('Failed to update settings. Please try again.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleToggleChange = () => {
        const newSettings = { ...settings, isOrderingEnabled: !settings.isOrderingEnabled };
        setSettings(newSettings);
        handleSaveSettings(newSettings);
    };
    
    const handleTimeChange = (e) => {
        setSettings({ ...settings, orderClosingTime: e.target.value });
    };

    const handleTimeBlur = () => {
        handleSaveSettings(settings);
    }

    return (
        <div className="admin-management-card">
            <h3 className="card-title">Store Settings</h3>
            {loading ? (
                <p>Loading settings...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Accepting Orders</span>
                        <label htmlFor="ordering-toggle" className="inline-flex relative items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.isOrderingEnabled}
                                onChange={handleToggleChange}
                                id="ordering-toggle"
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <label htmlFor="closing-time" className="font-medium text-gray-700">Order Closing Time</label>
                        <input
                            type="time"
                            id="closing-time"
                            value={settings.orderClosingTime}
                            onChange={handleTimeChange}
                            onBlur={handleTimeBlur}
                            className="border-gray-300 rounded-md shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManager;
