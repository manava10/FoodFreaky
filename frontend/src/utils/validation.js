/**
 * Validation utility functions for form inputs
 * Provides consistent validation across the application
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return '';
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {boolean} requireStrong - Whether to enforce strong password rules
 * @returns {string} - Error message or empty string if valid
 */
export const validatePassword = (password, requireStrong = false) => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  if (requireStrong) {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
  }
  
  return '';
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }
  
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return 'Phone number must be exactly 10 digits';
  }
  
  return '';
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validateName = (name) => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.trim().length < 3) {
    return 'Name must be at least 3 characters';
  }
  
  if (name.trim().length > 50) {
    return 'Name must not exceed 50 characters';
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return 'Name can only contain letters and spaces';
  }
  
  return '';
};

/**
 * Validate address
 * @param {string} address - Address to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validateAddress = (address) => {
  if (!address) {
    return 'Address is required';
  }
  
  if (address.trim().length < 10) {
    return 'Please provide a complete address (minimum 10 characters)';
  }
  
  return '';
};

/**
 * Validate OTP
 * @param {string} otp - OTP to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return 'OTP is required';
  }
  
  if (!/^[0-9]{6}$/.test(otp)) {
    return 'OTP must be exactly 6 digits';
  }
  
  return '';
};

/**
 * Validate coupon code
 * @param {string} coupon - Coupon code to validate
 * @returns {string} - Error message or empty string if valid
 */
export const validateCoupon = (coupon) => {
  if (!coupon) {
    return 'Coupon code is required';
  }
  
  if (coupon.length < 3 || coupon.length > 20) {
    return 'Coupon code must be between 3 and 20 characters';
  }
  
  return '';
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate all form fields at once
 * @param {Object} fields - Object containing field names and values
 * @param {Object} validators - Object mapping field names to validator functions
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateForm = (fields, validators) => {
  const errors = {};
  
  Object.keys(validators).forEach(fieldName => {
    const validator = validators[fieldName];
    const fieldValue = fields[fieldName];
    const error = validator(fieldValue);
    
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return errors;
};
