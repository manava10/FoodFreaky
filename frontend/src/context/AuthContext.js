import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (authToken) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    };
                    const { data } = await axios.get('http://localhost:5001/api/auth/me', config);
                    setUser(data.data);
                } catch (error) {
                    // Token is invalid or expired
                    localStorage.removeItem('authToken');
                    setAuthToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, [authToken]);

    const login = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
    };

    const value = {
        authToken,
        user,
        isLoggedIn: !!authToken,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
