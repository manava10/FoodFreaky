import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/settings/ordering`);
            setIsOrderingEnabled(data.isOrderingEnabled);
        } catch (error) {
            console.error("Failed to fetch settings, defaulting to enabled.", error);
            // Default to true if the API call fails so the site isn't accidentally disabled
            setIsOrderingEnabled(true);
        } finally {
            setIsLoadingSettings(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const value = {
        isOrderingEnabled,
        isLoadingSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
