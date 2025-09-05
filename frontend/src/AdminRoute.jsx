import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const AdminRoute = ({ children, roles }) => {
    const { isLoggedIn, user, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>; // Or a spinner component
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" />;
    }

    if (!roles.includes(user.role)) {
        return <Navigate to="/" />; // Redirect unauthorized roles to the homepage
    }

    return children;
};

export default AdminRoute;
