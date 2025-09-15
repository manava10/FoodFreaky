import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css'; // Changed to shared CSS
import foodBackground from '../assets/images/food-background.jpg';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/dashboard');
        }
    }, [isLoggedIn, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }
        setIsLoading(true);
        try {
            const { firstName, lastName, email, password, contactNumber } = formData;
            const name = `${firstName} ${lastName}`;
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, { name, email, password, contactNumber });
            setMessage(res.data.msg);
            setIsOtpStep(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, { email: formData.email, otp });
            
            localStorage.setItem('authToken', data.token);
            window.location.href = '/dashboard'; 

        } catch (err) {
            setError(err.response?.data?.msg || 'OTP verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative auth-page">
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${foodBackground})`
                }}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="floating-element absolute top-20 left-10 text-3xl opacity-20">🍕</div>
                    <div className="floating-element-slow absolute top-40 right-20 text-2xl opacity-15">🍔</div>
                    <div className="floating-element absolute bottom-32 left-1/4 text-3xl opacity-15">🍜</div>
                    <div className="floating-element-slow absolute top-1/3 right-1/4 text-2xl opacity-20">🌮</div>
                    <div className="floating-element absolute bottom-20 right-1/3 text-2xl opacity-15">🍰</div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            </div>

            <Header />

            <main className="relative z-10 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-4xl">
                    <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 max-w-md mx-auto">
                        
                        {!isOtpStep ? (
                            <form onSubmit={handleRegisterSubmit} className="space-y-5">
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-wide">
                                        Join <span className="text-orange-500 font-normal">FoodFreaky</span>
                                    </h1>
                                    <p className="text-gray-600 font-light text-sm">Create your account to get started!</p>
                                </div>
                                {error && <p className="auth-error-message">{error}</p>}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="auth-label">First Name</label>
                                        <input type="text" name="firstName" placeholder="Your first name" value={formData.firstName} onChange={handleChange} className="auth-input" required />
                                    </div>
                                    <div>
                                        <label className="auth-label">Last Name</label>
                                        <input type="text" name="lastName" placeholder="Your last name" value={formData.lastName} onChange={handleChange} className="auth-input" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="auth-label">Email Address</label>
                                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} className="auth-input" required />
                                </div>
                                <div>
                                    <label className="auth-label">Contact Number</label>
                                    <input type="tel" name="contactNumber" placeholder="Enter your 10-digit number" value={formData.contactNumber} onChange={handleChange} className="auth-input" required />
                                </div>
                                <div>
                                    <label className="auth-label">Password</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} className="auth-input pr-12" required />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="auth-label">Confirm Password</label>
                                    <div className="relative">
                                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} className="auth-input pr-12" required />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            {showConfirmPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                
                                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Sending OTP...' : 'Register 🚀'}
                                </button>

                                <div className="text-center">
                                    <p className="text-gray-600 font-light text-sm">
                                        Already have an account? 
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-orange-500 hover:text-orange-600 font-medium ml-1"
                                        >
                                            Sign in here
                                        </button>
                                    </p>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleOtpSubmit} className="space-y-5">
                                <div className="text-center mb-6">
                                     <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-wide">Verify Your Email</h1>
                                     <p className="text-gray-600 font-light text-sm">{message}</p>
                                </div>
                                {error && <p className="auth-error-message">{error}</p>}
                               
                                <div>
                                    <label className="auth-label">Verification Code</label>
                                    <input type="text" name="otp" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="auth-input text-center tracking-[1em]" maxLength="6" required />
                                </div>

                                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                                </button>
                                 <div className="text-center">
                                     <p className="text-gray-600 font-light text-sm">
                                         Didn't receive a code? 
                                         <button 
                                             type="button"
                                             // Add resend OTP logic here later
                                             className="text-orange-500 hover:text-orange-600 font-medium ml-1"
                                         >
                                             Resend
                                         </button>
                                     </p>
                                 </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RegisterPage;
