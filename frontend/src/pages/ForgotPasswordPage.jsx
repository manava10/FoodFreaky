import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './AuthPage.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgotpassword`, { email });
            setMessage(data.data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to send email');
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
                                <h1 className="text-3xl font-light text-gray-800 mb-2 tracking-wide">Forgot Password</h1>
                                <p className="text-gray-600 font-light text-sm">Enter your email to receive a reset link.</p>
                            </div>
                            
                            {error && <p className="auth-error-message">{error}</p>}
                            {message && <p className="text-green-500 text-center text-sm mb-4">{message}</p>}
                           
                            <div>
                                <label className="auth-label">Email Address</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Enter your registered email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                Send Reset Link
                            </button>
                             <div className="text-center">
                                 <p className="text-gray-600 font-light text-sm">
                                     Remember your password? 
                                     <button 
                                         type="button"
                                         onClick={() => navigate('/login')}
                                         className="text-orange-500 hover:text-orange-600 font-medium ml-1"
                                     >
                                         Login here
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

export default ForgotPasswordPage;
