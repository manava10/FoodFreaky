import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Note: Toast notifications can't be used here because AuthContext wraps ToastProvider
// For inactivity logout, we'll dispatch a custom event that components can listen to

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error("Invalid token", error);
                logout(); // Clear invalid token
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let inactivityTimer;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                // If user is inactive for 5 minutes, log them out
                if (isLoggedIn) {
                    logout();
                    // Dispatch event for toast notification (components can listen to this)
                    window.dispatchEvent(new CustomEvent('userInactivity', { 
                        detail: { message: 'You have been logged out due to inactivity.' }
                    }));
                }
            }, 5 * 60 * 1000); // 5 minutes
        };

        // Events that reset the timer
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer(); // Initial timer setup

        // Cleanup function
        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [isLoggedIn]); // Rerun effect if login state changes


    const login = async (email, password) => {
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('authToken', data.token);
            setUser(data.user); // Restore this line to use the user object from the response
            setIsLoggedIn(true); // Restore this line for immediate state update
            setAuthToken(data.token);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        setIsLoggedIn(false);
    };

    const setAuth = (token, userData) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        setUser(userData);
        setIsLoggedIn(true);
    };

    const value = {
        authToken,
        user,
        isLoggedIn,
        loading,
        login,
        logout,
        setAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
