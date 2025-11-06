import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const newToast = {
            id,
            message,
            type,
            duration,
        };

        setToasts((prevToasts) => [...prevToasts, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => {
            const toast = prevToasts.find((t) => t.id === id);
            if (toast) {
                // Add exiting class for animation
                const updatedToasts = prevToasts.map((t) =>
                    t.id === id ? { ...t, exiting: true } : t
                );
                
                // Remove after animation
                setTimeout(() => {
                    setToasts((currentToasts) => 
                        currentToasts.filter((t) => t.id !== id)
                    );
                }, 300);
                
                return updatedToasts;
            }
            return prevToasts.filter((t) => t.id !== id);
        });
    }, []);

    // Convenience methods for different toast types
    const showSuccess = useCallback((message, duration = 4000) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    const showError = useCallback((message, duration = 5000) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    const showWarning = useCallback((message, duration = 4000) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    const showInfo = useCallback((message, duration = 4000) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    const value = {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        duration={toast.duration}
                        onClose={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

