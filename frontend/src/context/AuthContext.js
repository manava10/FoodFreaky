import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!authToken);

    const fetchUser = useCallback(() => {
        if (authToken) {
            try {
                const decoded = jwtDecode(authToken);
                // Ensure the user state is set with all available info from the token
                setUser({
                    id: decoded.id,
                    name: decoded.name,
                    email: decoded.email,
                    role: decoded.role,
                    contactNumber: decoded.contactNumber, // Make sure to get it from the token
                    createdAt: decoded.createdAt
                });
                setIsLoggedIn(true);
            } catch (error) {
                console.error("Invalid token", error);
                // Token is invalid or expired
                localStorage.removeItem('authToken');
                setAuthToken(null);
                setUser(null);
                setIsLoggedIn(false);
            }
        }
        setLoading(false);
    }, [authToken]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

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

    const value = {
        authToken,
        user,
        isLoggedIn,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
