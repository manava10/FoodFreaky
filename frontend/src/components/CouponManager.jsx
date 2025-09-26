import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useAuth();
    
    // Form state
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState('percentage');
    const [value, setValue] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [error, setError] = useState('');

    const fetchCoupons = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/coupons`, config);
            setCoupons(data.data);
        } catch (error) {
            console.error('Failed to fetch coupons', error);
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };

            let expires = null;
            if (expiresAt) {
                // Create date in local timezone, then set time to the end of the day
                expires = new Date(expiresAt);
                expires.setHours(23, 59, 59, 999);
            }

            const newCoupon = { 
                code, 
                discountType, 
                value, 
                expiresAt: expires,
                usageLimit: usageLimit ? Number(usageLimit) : null 
            };
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/coupons`, newCoupon, config);
            setCoupons([data.data, ...coupons]);
            // Clear form
            setCode(''); setDiscountType('percentage'); setValue(''); setExpiresAt(''); setUsageLimit('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${authToken}` } };
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/coupons/${id}`, config);
                setCoupons(coupons.filter(c => c._id !== id));
            } catch (err) {
                alert('Failed to delete coupon');
            }
        }
    };

    return (
        <div className="admin-management-card">
            <h3 className="card-title">Coupon Management</h3>
            
            <form onSubmit={handleCreateCoupon} className="coupon-form">
                <div className="form-grid">
                    <input type="text" placeholder="Coupon Code (e.g., SUMMER20)" value={code} onChange={e => setCode(e.target.value)} required />
                    <input type="number" placeholder="Value (e.g., 20)" value={value} onChange={e => setValue(e.target.value)} required min="0" />
                    <input type="number" placeholder="Usage Limit (optional)" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} min="0" />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                    <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                </div>
                <button type="submit" className="create-coupon-btn">Create Coupon</button>
                {error && <p className="error-message">{error}</p>}
            </form>

            <div className="coupon-list">
                {loading ? <p>Loading coupons...</p> : coupons.map(coupon => (
                    <div key={coupon._id} className="coupon-item">
                        <div>
                            <strong className="coupon-code">{coupon.code}</strong>
                            <p>{coupon.discountType === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}</p>
                            <small>Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</small>
                            <small style={{ display: 'block' }}>
                                Usage: {coupon.timesUsed} / {coupon.usageLimit !== null ? coupon.usageLimit : '∞'}
                            </small>
                        </div>
                        <button onClick={() => handleDeleteCoupon(coupon._id)} className="delete-coupon-btn">&times;</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default CouponManager;
