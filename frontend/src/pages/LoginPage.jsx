import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import axios from 'axios';
import './AuthPage.css'; // Changed to shared CSS
import foodBackground from '../assets/images/food-background.jpg';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login, isLoggedIn, setAuth } = useAuth();
    const { showInfo, showError, showSuccess } = useToast();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (location.state && location.state.message) {
            setSuccessMessage(location.state.message);
        }
    }, [location.state]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
            try {
                // Use the login function from AuthContext
                await login(formData.email, formData.password);
                navigate('/dashboard');
            } catch (error) {
                const errorMsg = (error.response && error.response.data && error.response.data.msg) || 'Login failed. Please check credentials.';
                setErrors({ ...newErrors, form: errorMsg });
            }
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    useEffect(() => {
        // Wait for Google script to load, then initialize
        const initGoogleSignIn = () => {
            if (window.google && window.google.accounts && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                        callback: handleGoogleCallback,
                    });
                    console.log('Google Sign-In initialized successfully');
                } catch (error) {
                    console.error('Error initializing Google Sign-In:', error);
                }
            }
        };

        // Check if Google script is already loaded
        if (window.google) {
            initGoogleSignIn();
        } else {
            // Wait for script to load (check every 100ms)
            const checkGoogle = setInterval(() => {
                if (window.google) {
                    clearInterval(checkGoogle);
                    initGoogleSignIn();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkGoogle);
                if (!window.google) {
                    console.error('Google Sign-In script failed to load after 5 seconds');
                }
            }, 5000);
        }
    }, []);

    const handleGoogleCallback = async (response) => {
        setIsGoogleLoading(true);
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/google`,
                { idToken: response.credential }
            );

            if (data.success && data.token) {
                localStorage.setItem('authToken', data.token);
                setAuth(data.token, data.user);
                showSuccess(data.isNewUser ? 'Welcome to FoodFreaky! 🎉' : 'Welcome back!');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Google login error:', error);
            showError(error.response?.data?.msg || 'Google login failed. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
            console.error('Google Client ID is missing!');
            showError('Google Sign-In is not configured. Please contact support.');
            return;
        }

        if (!window.google || !window.google.accounts) {
            showError('Google Sign-In is still loading. Please wait a moment and try again.');
            return;
        }

        try {
            // Use renderButton approach for more reliable sign-in
            const buttonDiv = document.createElement('div');
            buttonDiv.id = 'google-signin-button';
            buttonDiv.style.display = 'none';
            document.body.appendChild(buttonDiv);

            window.google.accounts.id.renderButton(
                buttonDiv,
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    width: '100%',
                    type: 'standard',
                }
            );

            // Trigger the button click programmatically
            const button = buttonDiv.querySelector('div[role="button"]');
            if (button) {
                button.click();
            } else {
                // Fallback: use prompt
                window.google.accounts.id.prompt();
            }

            // Clean up after a delay
            setTimeout(() => {
                if (buttonDiv.parentNode) {
                    buttonDiv.parentNode.removeChild(buttonDiv);
                }
            }, 1000);
        } catch (error) {
            console.error('Error with Google Sign-In:', error);
            // Fallback to prompt
            try {
                window.google.accounts.id.prompt();
            } catch (promptError) {
                console.error('Prompt also failed:', promptError);
                showError('An error occurred with Google Sign-In. Please check your Google Cloud Console settings.');
            }
        }
    };

    const handleSignUp = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen relative auth-page">
            {/* Food Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${foodBackground})`
                }}
            >
                {/* Animated floating elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="floating-element absolute top-20 left-10 text-3xl opacity-20">🍕</div>
                    <div className="floating-element-slow absolute top-40 right-20 text-2xl opacity-15">🍔</div>
                    <div className="floating-element absolute bottom-32 left-1/4 text-3xl opacity-15">🍜</div>
                    <div className="floating-element-slow absolute top-1/3 right-1/4 text-2xl opacity-20">🌮</div>
                    <div className="floating-element absolute bottom-20 right-1/3 text-2xl opacity-15">🍰</div>
                </div>
                
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            </div>

            <Header />

            {/* Main Content */}
            <main className="relative z-10 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-4xl">
                    {/* Login Form */}
                    <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 max-w-md mx-auto">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-wide">
                                Welcome to <span className="text-orange-500 font-normal">FoodFreaky</span>
                            </h1>
                            <p className="text-gray-600 font-light text-sm">Sign in to your account and continue your food journey!</p>
                        </div>

                        {successMessage && <p className="text-green-500 text-center text-sm mb-4">{successMessage}</p>}
                        {errors.form && <p className="auth-error-message">{errors.form}</p>}
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="auth-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`auth-input ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="auth-label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`auth-input pr-12 ${errors.password ? 'border-red-500' : ''}`}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <label className="text-gray-700 font-light text-sm">
                                        Remember me
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="auth-submit-btn"
                            >
                                Sign In 🚀
                            </button>

                            {/* Divider */}
                            <div className="flex items-center my-6">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-3 text-gray-500 text-sm">or</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* Google Sign In Button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Sign in with Google</span>
                            </button>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <p className="text-gray-600 font-light text-sm">
                                    Don't have an account? 
                                    <button 
                                        type="button"
                                        onClick={handleSignUp}
                                        className="text-orange-500 hover:text-orange-600 font-medium ml-1"
                                    >
                                        Create one here
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;
