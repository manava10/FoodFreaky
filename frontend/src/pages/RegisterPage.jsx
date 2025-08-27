import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

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

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        
        if (Object.keys(newErrors).length === 0) {
            alert('Registration successful! Welcome to FoodFreaky! 🎉');
            // Here you would typically send data to your backend
        } else {
            setErrors(newErrors);
        }
    };

    const goBack = () => {
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen relative">
            {/* Food Background */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
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

            {/* Header */}
            <header className="relative z-10 p-6">
                <nav className="flex items-center justify-end max-w-7xl mx-auto">
                    <button 
                        onClick={goBack}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg transition-all duration-300 font-semibold tracking-wide shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-orange-400"
                    >
                        ← Back to Home
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex items-center justify-center px-6 py-4">
                <div className="w-full max-w-4xl">
                    {/* Registration Form */}
                    <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto">
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-light text-gray-800 mb-1 tracking-wide">
                                Join <span className="text-orange-500 font-normal">FoodFreaky</span>
                            </h1>
                            <p className="text-gray-600 font-light text-sm">Create your account and start ordering delicious food!</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-sm ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your first name"
                                    />
                                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-sm ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your last name"
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                </div>
                            </div>

                            {/* Email and Phone in same row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your email address"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your phone number"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 pr-10 text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Create a password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 pr-10 text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            {showConfirmPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleInputChange}
                                    className="mt-0.5 h-3 w-3 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 font-light text-sm">
                                    I agree to the <span className="text-orange-500 hover:text-orange-600 cursor-pointer">Terms of Service</span> and <span className="text-orange-500 hover:text-orange-600 cursor-pointer">Privacy Policy</span>
                                </label>
                            </div>
                            {errors.agreeToTerms && <p className="text-red-500 text-xs">{errors.agreeToTerms}</p>}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Create Account 🚀
                            </button>

                            {/* Divider */}
                            <div className="flex items-center my-4">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-3 text-gray-500 text-sm">or</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* Google Sign Up Button */}
                            <button
                                type="button"
                                onClick={() => alert('Google Sign Up coming soon! 🚀')}
                                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Sign up with Google</span>
                            </button>

                            {/* Login Link */}
                            <div className="text-center">
                                <p className="text-gray-600 font-light text-sm">
                                    Already have an account? 
                                    <button 
                                        type="button"
                                        onClick={handleLogin}
                                        className="text-orange-500 hover:text-orange-600 font-medium ml-1"
                                    >
                                        Sign in here
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

export default RegisterPage;
