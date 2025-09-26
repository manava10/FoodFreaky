import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        isOrderingEnabled: true,
        orderClosingTime: "22:00"
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings`);
            if (data.settings) {
                setSettings({
                    isOrderingEnabled: data.settings.isOrderingEnabled,
                    orderClosingTime: data.settings.orderClosingTime
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings, using default values.", error);
            // Default to true if the API call fails so the site isn't accidentally disabled
            setSettings({ isOrderingEnabled: true, orderClosingTime: "22:00" });
        } finally {
            setIsLoadingSettings(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const value = {
        settings,
        isLoadingSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
