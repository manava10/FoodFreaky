import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './AuthPage.css';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { resettoken } = useParams();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/resetpassword/${resettoken}`, { password });
            setMessage(data.data + ". Redirecting to login...");
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reset password');
        }
    };

    return (
        <div className="min-h-screen relative auth-page">
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            </div>

            <Header />

            <main className="relative z-10 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-4xl">
                    <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 max-w-md mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-wide">Reset Your Password</h1>
                                <p className="text-gray-600 font-light text-sm">Enter and confirm your new password.</p>
                            </div>
                            
                            {error && <p className="auth-error-message">{error}</p>}
                            {message && <p className="text-green-500 text-center text-sm mb-4">{message}</p>}
                           
                            <div>
                                <label className="auth-label">New Password</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="Enter your new password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="auth-label">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    placeholder="Confirm your new password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordPage;
