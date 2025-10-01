# FoodFreaky Complete Guide 📚
## From Basics to Advanced - Everything You Need to Know

This comprehensive guide will take you from basic concepts to advanced understanding of how the FoodFreaky application works. We'll cover every aspect of the system, from how a user clicks a button to how data flows through the entire stack.

---

## Table of Contents

1. [Introduction & Architecture Overview](#1-introduction--architecture-overview)
2. [Understanding the Request-Response Model](#2-understanding-the-request-response-model)
3. [Frontend Architecture Deep Dive](#3-frontend-architecture-deep-dive)
4. [Backend Architecture Deep Dive](#4-backend-architecture-deep-dive)
5. [Authentication Flow - Complete Journey](#5-authentication-flow---complete-journey)
6. [Restaurant Browsing Flow](#6-restaurant-browsing-flow)
7. [Order Placement - Complete Lifecycle](#7-order-placement---complete-lifecycle)
8. [State Management with Context API](#8-state-management-with-context-api)
9. [Database Models & Relationships](#9-database-models--relationships)
10. [API Communication Patterns](#10-api-communication-patterns)
11. [Security & Middleware](#11-security--middleware)
12. [Email & PDF Generation](#12-email--pdf-generation)
13. [Error Handling Patterns](#13-error-handling-patterns)
14. [Code Examples & Walkthroughs](#14-code-examples--walkthroughs)
15. [Common Patterns & Best Practices](#15-common-patterns--best-practices)

---

## 1. Introduction & Architecture Overview

### 1.1 What is FoodFreaky?

FoodFreaky is a **full-stack food delivery application** built using the MERN stack:
- **M**ongoDB - Database for storing data
- **E**xpress.js - Backend framework for APIs
- **R**eact - Frontend library for UI
- **N**ode.js - JavaScript runtime for backend

### 1.2 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │             React Frontend (Port 3000)                      │ │
│  │  - UI Components (buttons, forms, pages)                   │ │
│  │  - State Management (Context API)                          │ │
│  │  - Routing (React Router)                                  │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ HTTP Requests (Axios)
                          │ (JSON data)
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Express Backend (Port 5000)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Routes → Middleware → Controllers → Models                │ │
│  │     ↓          ↓            ↓            ↓                 │ │
│  │  /api/auth  protect()    authLogic    userSchema          │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ Mongoose ODM
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Collections: users, restaurants, orders, coupons          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 How They Work Together

Think of it like a restaurant:
- **Frontend (React)** = The dining area where customers (users) interact
- **Backend (Express)** = The kitchen where orders are processed
- **Database (MongoDB)** = The storage room where ingredients (data) are kept
- **API** = The waiter who takes orders from customers to the kitchen


---

## 2. Understanding the Request-Response Model

### 2.1 The Basic Flow

Every interaction in FoodFreaky follows this pattern:

```
User Action → Frontend → HTTP Request → Backend → Database → Response
```

### 2.2 Detailed Example: User Logs In

Let's trace what happens when a user clicks the "Login" button:

**Step 1: User Fills Form and Clicks Login**
```jsx
// Frontend: LoginPage.jsx
const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent page reload
    
    // Call login function from AuthContext
    await login(email, password);
};
```

**Step 2: AuthContext Makes API Call**
```javascript
// Frontend: context/AuthContext.js
const login = async (email, password) => {
    // Make HTTP POST request to backend
    const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password }
    );
    
    // Save token in browser's localStorage
    localStorage.setItem('authToken', data.token);
    
    // Update app state
    setUser(data.user);
    setIsLoggedIn(true);
};
```

**Step 3: Request Travels to Backend**
```
HTTP POST Request:
├─ URL: http://localhost:5000/api/auth/login
├─ Headers: { 'Content-Type': 'application/json' }
└─ Body: { email: "user@example.com", password: "password123" }
```

**Step 4: Backend Receives Request**
```javascript
// Backend: index.js
app.use('/api/auth', auth);  // Routes request to auth routes

// Backend: routes/auth.js
router.post('/login', login);  // Routes to login controller
```

**Step 5: Controller Processes Request**
```javascript
// Backend: controllers/auth.js
exports.login = async (req, res) => {
    const { email, password } = req.body;  // Extract data
    
    // Query database for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials.' });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
        return res.status(401).json({ msg: 'Account not verified.' });
    }
    
    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials.' });
    }
    
    // Create JWT token
    const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Send response back to frontend
    res.json({ success: true, token, user: payload });
};
```

**Step 6: Response Travels Back to Frontend**
```
HTTP Response:
├─ Status: 200 OK
└─ Body: {
    success: true,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
        id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "user@example.com",
        role: "user"
    }
}
```

**Step 7: Frontend Updates UI**
```javascript
// AuthContext stores token and user data
// React re-renders components
// User sees their dashboard
```

### 2.3 Key Concepts

**HTTP Methods Used:**
- `GET` - Retrieve data (e.g., get restaurants)
- `POST` - Create new data (e.g., register user, create order)
- `PUT` - Update data (e.g., update order status)
- `DELETE` - Delete data (e.g., delete restaurant)

**Status Codes:**
- `200` - Success
- `201` - Created (new resource)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

## 3. Frontend Architecture Deep Dive

### 3.1 Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation bar
│   ├── Cart.jsx        # Shopping cart sidebar
│   ├── Modal.jsx       # Popup modal
│   ├── Rating.jsx      # Star rating display
│   └── ErrorBoundary.jsx
├── pages/              # Full page components
│   ├── HomePage.jsx    # Landing page
│   ├── RestaurantPage.jsx  # Browse restaurants
│   ├── LoginPage.jsx   # User login
│   ├── RegisterPage.jsx # User registration
│   ├── CheckoutPage.jsx # Order placement
│   └── DashboardPage.jsx # User dashboard
├── context/            # State management
│   ├── AuthContext.js  # Authentication state
│   ├── CartContext.js  # Shopping cart state
│   └── SettingsContext.js # App settings
├── utils/              # Utility functions
├── assets/             # Images and static files
├── App.js              # Main app component
└── index.js            # Entry point
```

### 3.2 Routing System

React Router handles navigation without page reloads:

```javascript
// App.js
<Routes>
    {/* Public Routes - Anyone can access */}
    <Route path="/" element={<HomePage />} />
    <Route path="/restaurants" element={<RestaurantPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    
    {/* Protected Routes - Must be logged in */}
    <Route path="/dashboard" element={
        <ProtectedRoute>
            <DashboardPage />
        </ProtectedRoute>
    } />
    <Route path="/checkout" element={
        <ProtectedRoute>
            <CheckoutPage />
        </ProtectedRoute>
    } />
    
    {/* Admin Routes - Must have admin role */}
    <Route path="/superadmin" element={
        <AdminRoute roles={['admin']}>
            <SuperAdminPage />
        </AdminRoute>
    } />
</Routes>
```

**How ProtectedRoute Works:**
```javascript
// ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    // If not logged in, redirect to login page
    if (!isLoggedIn) {
        return <Navigate to="/login" />;
    }
    
    // If logged in, show the protected content
    return children;
};
```

### 3.3 Component Lifecycle

When you visit a page, this happens:

```javascript
// Example: RestaurantPage.jsx

function RestaurantPage() {
    // 1. Component mounts
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 2. useEffect runs after first render
    useEffect(() => {
        fetchRestaurants();
    }, []);  // Empty array = run once on mount
    
    // 3. Fetch data from backend
    const fetchRestaurants = async () => {
        try {
            const response = await axios.get('/api/restaurants');
            setRestaurants(response.data.data);  // 4. Update state
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };
    
    // 5. State update triggers re-render
    // 6. Component displays restaurants
    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                restaurants.map(restaurant => (
                    <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                ))
            )}
        </div>
    );
}
```

### 3.4 State Management with Hooks

**useState** - Local component state:
```javascript
const [count, setCount] = useState(0);  // Initial value is 0

// Update state
setCount(count + 1);
// OR with function (safer)
setCount(prev => prev + 1);
```

**useEffect** - Side effects (API calls, subscriptions):
```javascript
// Run once on mount
useEffect(() => {
    fetchData();
}, []);

// Run when dependency changes
useEffect(() => {
    fetchData();
}, [userId]);  // Re-run when userId changes

// Cleanup function
useEffect(() => {
    const timer = setInterval(() => console.log('tick'), 1000);
    
    return () => clearInterval(timer);  // Cleanup on unmount
}, []);
```

**useContext** - Access global state:
```javascript
const { user, login, logout } = useAuth();  // From AuthContext
const { cartItems, addToCart } = useCart();  // From CartContext
```


---

## 4. Backend Architecture Deep Dive

### 4.1 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/           # Business logic
│   ├── auth.js           # Authentication logic
│   ├── restaurants.js    # Restaurant operations
│   ├── orders.js         # Order processing
│   ├── coupons.js        # Coupon management
│   └── admin.js          # Admin operations
├── middleware/           # Request processing
│   ├── auth.js           # JWT verification
│   ├── errorHandler.js   # Error handling
│   └── rateLimit.js      # Rate limiting
├── models/               # Database schemas
│   ├── User.js           # User model
│   ├── Restaurant.js     # Restaurant model
│   ├── Order.js          # Order model
│   └── Coupon.js         # Coupon model
├── routes/               # URL routing
│   ├── auth.js           # Auth routes
│   ├── restaurants.js    # Restaurant routes
│   ├── orders.js         # Order routes
│   └── admin.js          # Admin routes
├── utils/                # Helper functions
│   ├── sendEmail.js      # Email service
│   ├── generateOTP.js    # OTP generation
│   └── generateInvoicePdf.js  # PDF creation
└── index.js              # Server entry point
```

### 4.2 Server Initialization

```javascript
// backend/index.js

// 1. Import dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 2. Load environment variables
dotenv.config();

// 3. Connect to MongoDB
connectDB();

// 4. Create Express app
const app = express();

// 5. Apply middleware (in order!)
app.use(helmet());                    // Security headers
app.use(cors(corsOptions));           // Cross-origin requests
app.use(express.json());              // Parse JSON bodies
app.use(apiLimiter);                  // Rate limiting

// 6. Mount routes
app.use('/api/auth', auth);           // Auth endpoints
app.use('/api/restaurants', restaurants);
app.use('/api/orders', orders);
app.use('/api/admin', admin);

// 7. Error handler (MUST be last)
app.use(errorHandler);

// 8. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 4.3 Request Flow Through Backend

```
HTTP Request
    ↓
1. Helmet (security headers)
    ↓
2. CORS (check origin)
    ↓
3. express.json() (parse body)
    ↓
4. Rate Limiter (check limits)
    ↓
5. Router (match URL)
    ↓
6. Middleware (auth check if needed)
    ↓
7. Controller (business logic)
    ↓
8. Model (database query)
    ↓
9. Response sent back
```

### 4.4 Routing System

**Route Definition:**
```javascript
// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, verifyOtp, login } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

// Protected route (requires authentication)
router.get('/me', protect, getCurrentUser);

module.exports = router;
```

**How Routing Works:**
```
Request: POST /api/auth/login
         ↓
1. Server matches "/api/auth" → auth router
2. Auth router matches "/login" → login controller
3. Controller runs and sends response
```

### 4.5 Middleware Explained

Middleware are functions that process requests before they reach controllers.

**Authentication Middleware:**
```javascript
// backend/middleware/auth.js

exports.protect = async (req, res, next) => {
    let token;
    
    // 1. Extract token from header
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ msg: 'Not authorized' });
    }
    
    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Fetch user from database
        req.user = await User.findById(decoded.id);
        
        // 5. Continue to next middleware/controller
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
```

**Usage:**
```javascript
// Protected route
router.get('/orders', protect, getMyOrders);

// When request comes:
// 1. protect() runs first
// 2. If valid token, adds user to req.user
// 3. getMyOrders() can access req.user
```

**Role-Based Authorization:**
```javascript
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        next();
    };
};

// Usage: Only admins can access
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
```

### 4.6 Controllers - Business Logic

Controllers handle the actual work:

```javascript
// backend/controllers/restaurants.js

exports.getRestaurants = async (req, res) => {
    try {
        // 1. Query database
        const restaurants = await Restaurant.find();
        
        // 2. Send success response
        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants
        });
    } catch (error) {
        // 3. Send error response
        res.status(500).json({
            success: false,
            msg: 'Server error'
        });
    }
};

exports.getRestaurant = async (req, res) => {
    try {
        // Get ID from URL params
        const restaurant = await Restaurant.findById(req.params.id);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                msg: 'Restaurant not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
```

---

## 5. Authentication Flow - Complete Journey

### 5.1 User Registration Process

**Step-by-Step:**

1. **User fills registration form**
2. **Frontend validates input**
3. **POST request to /api/auth/register**
4. **Backend checks if user exists**
5. **Generate OTP (6-digit code)**
6. **Hash password with bcrypt**
7. **Save user to database (unverified)**
8. **Send OTP email**
9. **User receives OTP in email**
10. **User enters OTP in verification form**
11. **POST request to /api/auth/verify-otp**
12. **Backend validates OTP and expiry**
13. **Mark user as verified**
14. **Generate JWT token**
15. **Send token to frontend**
16. **Frontend stores token**
17. **User is logged in**

**Code Flow:**

```javascript
// Frontend: RegisterPage.jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        // Send registration data
        const response = await axios.post('/api/auth/register', {
            name,
            email,
            password,
            contactNumber
        });
        
        // Show OTP verification form
        setShowOtpForm(true);
        setMessage('OTP sent to your email');
    } catch (error) {
        setError(error.response.data.msg);
    }
};
```

```javascript
// Backend: controllers/auth.js
exports.register = async (req, res) => {
    const { name, email, password, contactNumber } = req.body;
    
    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        
        if (user && user.isVerified) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        
        // 2. Generate OTP
        const otp = generateOTP();  // Returns 6-digit number
        const otpExpires = Date.now() + 10 * 60 * 1000;  // 10 minutes
        
        // 3. Create or update user
        if (user && !user.isVerified) {
            // Update existing unverified user
            user.name = name;
            user.password = password;  // Will be hashed by pre-save hook
            user.contactNumber = contactNumber;
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                name,
                email,
                password,  // Will be hashed by pre-save hook
                contactNumber,
                otp,
                otpExpires
            });
        }
        
        // 4. Send OTP email
        const message = `
            <p>Your verification code for FoodFreaky is:</p>
            <h2>${otp}</h2>
            <p>This code will expire in 10 minutes.</p>
        `;
        
        await sendEmail({
            email: user.email,
            subject: 'FoodFreaky - Email Verification',
            html: message
        });
        
        res.status(200).json({
            success: true,
            msg: 'OTP sent to email. Please verify.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during registration' });
    }
};
```

### 5.2 Password Hashing

Before saving to database, passwords are hashed:

```javascript
// backend/models/User.js

const bcrypt = require('bcryptjs');

// Pre-save hook
UserSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }
    
    // Generate salt (random string)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
});

// Example:
// Input: "mypassword123"
// Salt: "$2a$10$N9qo8uLOickgx2ZMRZoMye"
// Hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

### 5.3 JWT Token Generation

```javascript
// When user logs in or verifies OTP

const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    contactNumber: user.contactNumber,
    createdAt: user.createdAt
};

const token = jwt.sign(
    payload,                      // Data to encode
    process.env.JWT_SECRET,       // Secret key
    { expiresIn: '1h' }          // Token expires in 1 hour
);

// Example token:
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

**Token Structure:**
```
Header.Payload.Signature
  ↓      ↓        ↓
 algo   data   signature
```

### 5.4 Token Storage and Usage

**Frontend stores token:**
```javascript
// Save to localStorage
localStorage.setItem('authToken', token);

// Axios automatically adds to headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

**Backend verifies token:**
```javascript
// Every protected request:
// 1. Extract: "Bearer eyJhbGc..."
// 2. Split and get token
// 3. Verify signature with secret
// 4. Check expiry
// 5. Extract user ID
// 6. Fetch user from database
// 7. Attach to req.user
```


---

## 6. Restaurant Browsing Flow

### 6.1 How Restaurant Data Flows

```
User visits /restaurants page
        ↓
RestaurantPage component mounts
        ↓
useEffect hook triggers
        ↓
fetchRestaurants() function runs
        ↓
GET /api/restaurants
        ↓
Backend queries MongoDB
        ↓
Returns all restaurants with menus
        ↓
Frontend updates state
        ↓
React re-renders with restaurant cards
```

### 6.2 Complete Code Flow

**Frontend Request:**
```javascript
// frontend/src/pages/RestaurantPage.jsx

const RestaurantPage = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchRestaurants();
    }, []);
    
    const fetchRestaurants = async () => {
        try {
            // Make API call
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/restaurants`
            );
            
            // Extract data from response
            setRestaurants(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            setError('Failed to load restaurants');
        }
    };
    
    return (
        <div>
            {loading ? (
                <p>Loading restaurants...</p>
            ) : (
                restaurants.map(restaurant => (
                    <RestaurantCard 
                        key={restaurant._id} 
                        restaurant={restaurant}
                        onClick={() => setSelectedRestaurant(restaurant)}
                    />
                ))
            )}
        </div>
    );
};
```

**Backend Handler:**
```javascript
// backend/controllers/restaurants.js

exports.getRestaurants = async (req, res) => {
    try {
        // Find all restaurants in database
        const restaurants = await Restaurant.find();
        
        // Send response
        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants  // Array of restaurant objects
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            msg: 'Server error' 
        });
    }
};
```

**Database Query:**
```javascript
// Mongoose executes:
db.restaurants.find()

// Returns documents like:
[
    {
        _id: ObjectId("507f1f77bcf86cd799439011"),
        name: "Pizza Palace",
        cuisine: "Italian",
        deliveryTime: "30-45 min",
        tags: ["Pizza", "Fast Food"],
        imageUrl: "https://example.com/pizza.jpg",
        menu: [
            {
                category: "Pizzas",
                items: [
                    {
                        name: "Margherita",
                        price: 299,
                        emoji: "🍕"
                    }
                ]
            }
        ]
    },
    // ... more restaurants
]
```

### 6.3 Displaying Restaurant Menu

When user clicks a restaurant:

```javascript
const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveCategory(restaurant.menu[0]?.category || '');
};

// Modal shows restaurant details
<Modal isOpen={!!selectedRestaurant}>
    <h2>{selectedRestaurant.name}</h2>
    
    {/* Category tabs */}
    <div className="categories">
        {selectedRestaurant.menu.map(menuCategory => (
            <button onClick={() => setActiveCategory(menuCategory.category)}>
                {menuCategory.category}
            </button>
        ))}
    </div>
    
    {/* Menu items */}
    <div className="menu-items">
        {selectedRestaurant.menu
            .filter(m => m.category === activeCategory)
            .map(menuCategory => (
                menuCategory.items.map(item => (
                    <div key={item.name} className="menu-item">
                        <span>{item.emoji} {item.name}</span>
                        <span>₹{item.price}</span>
                        <button onClick={() => addToCart(item, selectedRestaurant)}>
                            Add to Cart
                        </button>
                    </div>
                ))
            ))
        }
    </div>
</Modal>
```

---

## 7. Order Placement - Complete Lifecycle

### 7.1 The Complete Order Journey

```
1. User adds items to cart (CartContext)
2. User clicks "Checkout"
3. Navigate to CheckoutPage
4. User fills shipping address
5. Applies coupon (optional)
6. Reviews order summary
7. Clicks "Place Order"
8. POST /api/orders
9. Backend creates order in database
10. Backend increments coupon usage
11. Backend sends confirmation email
12. Frontend shows success modal
13. Clears cart
14. Redirects to dashboard
15. User sees order in order history
```

### 7.2 Cart Management

**Adding Items to Cart:**
```javascript
// frontend/src/context/CartContext.js

const addToCart = (item, restaurant) => {
    // Check if adding from different restaurant
    const isNewRestaurant = cartItems.length > 0 && 
                           cartItems[0].restaurant.id !== restaurant.id;
    
    if (isNewRestaurant) {
        // Show confirmation modal
        setClearCartConfirmation({
            isOpen: true,
            item,
            restaurant
        });
        return;
    }
    
    // Check if item already in cart
    const existingItem = cartItems.find(x => x.name === item.name);
    
    if (existingItem) {
        // Increase quantity
        setCartItems(prevItems =>
            prevItems.map(x =>
                x.name === item.name
                    ? { ...x, quantity: x.quantity + 1 }
                    : x
            )
        );
    } else {
        // Add new item
        setCartItems(prevItems => [
            ...prevItems,
            {
                ...item,
                quantity: 1,
                restaurant: {
                    id: restaurant._id,
                    name: restaurant.name
                }
            }
        ]);
    }
};
```

**Cart Persistence:**
```javascript
// Save to localStorage whenever cart changes
useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}, [cartItems]);

// Load from localStorage on mount
const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('cartItems');
    return localData ? JSON.parse(localData) : [];
});
```

### 7.3 Checkout Process

**Frontend Checkout:**
```javascript
// frontend/src/pages/CheckoutPage.jsx

const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    try {
        setLoading(true);
        
        // Calculate prices
        const itemsPrice = cartItems.reduce(
            (acc, item) => acc + item.price * item.quantity, 
            0
        );
        const taxPrice = itemsPrice * 0.05;  // 5% GST
        const shippingPrice = 40;
        let totalPrice = itemsPrice + taxPrice + shippingPrice;
        
        // Apply coupon discount
        if (appliedCoupon) {
            if (appliedCoupon.discountType === 'percentage') {
                totalPrice -= (itemsPrice * appliedCoupon.value) / 100;
            } else {
                totalPrice -= appliedCoupon.value;
            }
        }
        
        // Prepare order data
        const orderData = {
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            restaurant: cartItems[0].restaurant.id,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponUsed: appliedCoupon?.code || null
        };
        
        // Make API request
        const { data } = await axios.post(
            '/api/orders',
            orderData,
            {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            }
        );
        
        // Clear cart
        clearCart();
        
        // Show success
        setShowSuccess(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            navigate('/dashboard');
        }, 2000);
        
    } catch (error) {
        setError(error.response?.data?.msg || 'Failed to place order');
    } finally {
        setLoading(false);
    }
};
```

**Backend Order Creation:**
```javascript
// backend/controllers/orders.js

exports.createOrder = async (req, res) => {
    try {
        const { 
            items, 
            restaurant,
            shippingAddress, 
            itemsPrice, 
            taxPrice, 
            shippingPrice, 
            totalPrice,
            couponUsed
        } = req.body;
        
        // Validate order items
        if (!items || items.length === 0) {
            return res.status(400).json({ msg: 'No order items' });
        }
        
        // Validate restaurant
        if (!restaurant) {
            return res.status(400).json({ msg: 'Restaurant ID is required' });
        }
        
        // Create order in database
        const order = new Order({
            user: req.user.id,  // From auth middleware
            restaurant,
            items,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponUsed,
            status: 'Waiting for Acceptance'  // Initial status
        });
        
        const createdOrder = await order.save();
        
        // Update coupon usage count
        if (couponUsed) {
            await Coupon.updateOne(
                { code: couponUsed.toUpperCase() },
                { $inc: { timesUsed: 1 } }
            );
        }
        
        // Send confirmation email (async, don't wait)
        sendOrderConfirmationEmail(req.user.email, createdOrder)
            .catch(err => console.error('Email failed:', err));
        
        // Return created order
        res.status(201).json(createdOrder);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};
```

### 7.4 Order Status Tracking

Orders go through these states:

```
Waiting for Acceptance  ← Initial state
        ↓
    Accepted           ← Restaurant accepts
        ↓
  Preparing Food       ← Kitchen prepares
        ↓
 Out for Delivery      ← Driver picks up
        ↓
    Delivered          ← Order complete
```

**Updating Order Status (Admin):**
```javascript
// backend/controllers/orders.js

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Find order
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Validate status
        const validStatuses = [
            'Waiting for Acceptance',
            'Accepted',
            'Preparing Food',
            'Out for Delivery',
            'Delivered',
            'Cancelled'
        ];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }
        
        // Update status
        order.status = status;
        
        // If delivered, set delivery timestamp
        if (status === 'Delivered') {
            order.deliveredAt = Date.now();
        }
        
        await order.save();
        
        // Send status update email
        await sendStatusUpdateEmail(order);
        
        res.json({ success: true, data: order });
        
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};
```

---

## 8. State Management with Context API

### 8.1 Why Context API?

Without Context:
```
App
├── Header (needs user)
│   └── UserMenu (needs user) ❌ Prop drilling
├── RestaurantPage (needs user)
│   └── MenuModal (needs user) ❌ Pass through multiple levels
└── CheckoutPage (needs user)
```

With Context:
```
AuthContext wraps entire app
    ↓
Any component can access user directly ✅
```

### 8.2 AuthContext - Complete Implementation

```javascript
// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// 1. Create context
const AuthContext = createContext();

// 2. Custom hook for easy access
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Provider component
export const AuthProvider = ({ children }) => {
    // State
    const [authToken, setAuthToken] = useState(
        localStorage.getItem('authToken')
    );
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    // On mount, check for existing token
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            try {
                // Decode token to get user info
                const decoded = jwtDecode(token);
                
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    // Token expired, log out
                    logout();
                } else {
                    // Token valid, set user
                    setUser(decoded);
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error("Invalid token", error);
                logout();
            }
        }
        
        setLoading(false);
    }, []);
    
    // Auto logout on inactivity
    useEffect(() => {
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (isLoggedIn) {
                    logout();
                    alert("You have been logged out due to inactivity.");
                }
            }, 5 * 60 * 1000);  // 5 minutes
        };
        
        // Events that reset timer
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => 
            window.addEventListener(event, resetTimer)
        );
        
        resetTimer();
        
        // Cleanup
        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => 
                window.removeEventListener(event, resetTimer)
            );
        };
    }, [isLoggedIn]);
    
    // Login function
    const login = async (email, password) => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/login`,
                { email, password }
            );
            
            // Store token
            localStorage.setItem('authToken', data.token);
            setAuthToken(data.token);
            
            // Set user
            setUser(data.user);
            setIsLoggedIn(true);
            
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };
    
    // Logout function
    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        setIsLoggedIn(false);
    };
    
    // Context value
    const value = {
        authToken,
        user,
        isLoggedIn,
        loading,
        login,
        logout
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
```

**Using AuthContext in Components:**
```javascript
// Any component
import { useAuth } from '../context/AuthContext';

function MyComponent() {
    const { user, isLoggedIn, login, logout } = useAuth();
    
    return (
        <div>
            {isLoggedIn ? (
                <>
                    <p>Welcome, {user.name}!</p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <button onClick={() => navigate('/login')}>Login</button>
            )}
        </div>
    );
}
```

### 8.3 CartContext - Shopping Cart Management

```javascript
// frontend/src/context/CartContext.js

export const CartProvider = ({ children }) => {
    // Load cart from localStorage
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('cartItems');
        return localData ? JSON.parse(localData) : [];
    });
    
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);
    
    // Add item to cart
    const addToCart = (item, restaurant) => {
        // Implementation shown earlier
    };
    
    // Remove item
    const removeFromCart = (itemName) => {
        setCartItems(prev => prev.filter(item => item.name !== itemName));
    };
    
    // Update quantity
    const updateQuantity = (name, quantity) => {
        if (quantity <= 0) {
            removeFromCart(name);
        } else {
            setCartItems(prev =>
                prev.map(item =>
                    item.name === name ? { ...item, quantity } : item
                )
            );
        }
    };
    
    // Clear cart
    const clearCart = () => {
        setCartItems([]);
    };
    
    // Calculate total
    const getCartTotal = () => {
        return cartItems.reduce(
            (total, item) => total + (item.price * item.quantity),
            0
        );
    };
    
    const value = {
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal
    };
    
    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
```


---

## 9. Database Models & Relationships

### 9.1 MongoDB Basics

MongoDB stores data in **collections** (like tables) with **documents** (like rows):

```
Database: foodfreaky
├── Collection: users
│   ├── Document: { _id: "507f...", name: "John", email: "john@example.com" }
│   ├── Document: { _id: "508g...", name: "Jane", email: "jane@example.com" }
│   └── ...
├── Collection: restaurants
│   ├── Document: { _id: "509h...", name: "Pizza Palace", ... }
│   └── ...
├── Collection: orders
└── Collection: coupons
```

### 9.2 User Model

```javascript
// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false  // Don't return password in queries by default
    },
    contactNumber: {
        type: String,
        required: [true, 'Please add a contact number']
    },
    role: {
        type: String,
        enum: ['user', 'deliveryadmin', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: String,
    otpExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', UserSchema);
```

**Example Document:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    "contactNumber": "+1234567890",
    "role": "user",
    "isVerified": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### 9.3 Restaurant Model

```javascript
// backend/models/Restaurant.js

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    cuisine: {
        type: String,
        required: true
    },
    deliveryTime: {
        type: String,
        default: "30-40 min"
    },
    tags: [{
        type: String
    }],
    imageUrl: {
        type: String,
        default: "/images/default-restaurant.jpg"
    },
    menu: [{
        category: {
            type: String,
            required: true
        },
        items: [{
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            emoji: String,
            imageUrl: String,
            description: String
        }]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    ratings: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
```

**Example Document:**
```json
{
    "_id": "507f1f77bcf86cd799439012",
    "name": "Pizza Palace",
    "cuisine": "Italian",
    "deliveryTime": "30-45 min",
    "tags": ["Pizza", "Fast Food", "Italian"],
    "imageUrl": "https://example.com/pizza-palace.jpg",
    "menu": [
        {
            "category": "Pizzas",
            "items": [
                {
                    "name": "Margherita Pizza",
                    "price": 299,
                    "emoji": "🍕",
                    "description": "Classic cheese and tomato"
                },
                {
                    "name": "Pepperoni Pizza",
                    "price": 399,
                    "emoji": "🍕"
                }
            ]
        },
        {
            "category": "Sides",
            "items": [
                {
                    "name": "Garlic Bread",
                    "price": 99,
                    "emoji": "🥖"
                }
            ]
        }
    ],
    "isActive": true,
    "ratings": {
        "average": 4.5,
        "count": 120
    },
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### 9.4 Order Model

```javascript
// backend/models/Order.js

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to User model
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',  // Reference to Restaurant model
        required: true
    },
    items: [{
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        type: String,
        required: true
    },
    itemsPrice: {
        type: Number,
        required: true
    },
    taxPrice: {
        type: Number,
        required: true
    },
    shippingPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: [
            'Waiting for Acceptance',
            'Accepted',
            'Preparing Food',
            'Out for Delivery',
            'Delivered',
            'Cancelled'
        ],
        default: 'Waiting for Acceptance'
    },
    deliveredAt: Date
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Order', OrderSchema);
```

### 9.5 Understanding References (Population)

Orders reference users and restaurants:

```javascript
// Without population
const order = await Order.findById(orderId);
console.log(order.user);  // Output: "507f1f77bcf86cd799439011" (just ID)

// With population
const order = await Order.findById(orderId)
    .populate('user', 'name email')  // Get user's name and email
    .populate('restaurant', 'name cuisine');  // Get restaurant details

console.log(order.user);
// Output: { _id: "507f...", name: "John Doe", email: "john@example.com" }
```

**Example Populated Order:**
```json
{
    "_id": "507f1f77bcf86cd799439013",
    "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
    },
    "restaurant": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Pizza Palace",
        "cuisine": "Italian"
    },
    "items": [
        {
            "name": "Margherita Pizza",
            "quantity": 2,
            "price": 299
        },
        {
            "name": "Garlic Bread",
            "quantity": 1,
            "price": 99
        }
    ],
    "shippingAddress": "123 Main St, City, State 12345",
    "itemsPrice": 697,
    "taxPrice": 34.85,
    "shippingPrice": 40,
    "totalPrice": 771.85,
    "couponUsed": "FIRSTORDER",
    "status": "Delivered",
    "createdAt": "2025-01-15T12:00:00.000Z",
    "deliveredAt": "2025-01-15T13:30:00.000Z"
}
```

---

## 10. API Communication Patterns

### 10.1 Axios Configuration

**Base Setup:**
```javascript
// frontend/src/utils/api.js

import axios from 'axios';

// Create axios instance with base config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000  // 10 seconds
});

// Request interceptor - Add auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 10.2 API Request Examples

**GET Request (Fetch Data):**
```javascript
// Get all restaurants
const fetchRestaurants = async () => {
    try {
        const response = await axios.get('/api/restaurants');
        console.log(response.data);
        // {
        //     success: true,
        //     count: 10,
        //     data: [{ restaurant1 }, { restaurant2 }, ...]
        // }
    } catch (error) {
        console.error(error.response.data);
    }
};

// Get single restaurant
const fetchRestaurant = async (id) => {
    const response = await axios.get(`/api/restaurants/${id}`);
    return response.data.data;
};
```

**POST Request (Create Data):**
```javascript
// Create new order
const createOrder = async (orderData) => {
    try {
        const response = await axios.post('/api/orders', orderData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Example orderData:
const orderData = {
    items: [
        { name: "Pizza", quantity: 2, price: 299 }
    ],
    restaurant: "507f1f77bcf86cd799439012",
    shippingAddress: "123 Main St",
    itemsPrice: 598,
    taxPrice: 29.9,
    shippingPrice: 40,
    totalPrice: 667.9,
    couponUsed: null
};
```

**PUT Request (Update Data):**
```javascript
// Update order status (admin)
const updateOrderStatus = async (orderId, status) => {
    const response = await axios.put(
        `/api/orders/${orderId}`,
        { status },
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );
    return response.data;
};
```

**DELETE Request (Delete Data):**
```javascript
// Delete restaurant (admin)
const deleteRestaurant = async (restaurantId) => {
    await axios.delete(`/api/admin/restaurants/${restaurantId}`, {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    });
};
```

### 10.3 Error Handling Patterns

**Try-Catch Pattern:**
```javascript
const handleAction = async () => {
    try {
        setLoading(true);
        setError(null);
        
        const response = await axios.post('/api/endpoint', data);
        
        // Success
        setSuccess(true);
        setData(response.data);
        
    } catch (error) {
        // Handle different error types
        if (error.response) {
            // Server responded with error status
            setError(error.response.data.msg || 'Request failed');
        } else if (error.request) {
            // Request made but no response
            setError('No response from server');
        } else {
            // Error setting up request
            setError('Request failed');
        }
    } finally {
        setLoading(false);
    }
};
```

**Async/Await with Error States:**
```javascript
const MyComponent = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get('/api/data');
            setData(response.data);
            
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!data) return null;
    
    return <div>{/* Render data */}</div>;
};
```


---

## 11. Security & Middleware

### 11.1 Security Layers

```
Request Flow with Security:

HTTP Request
    ↓
1. Helmet (Security Headers)
    ├─ X-Frame-Options: DENY (prevent clickjacking)
    ├─ X-Content-Type-Options: nosniff
    └─ Strict-Transport-Security
    ↓
2. CORS (Origin Check)
    └─ Allow only: localhost:3000, foodfreaky.in
    ↓
3. Rate Limiting
    └─ Max 100 requests per 15 minutes per IP
    ↓
4. Body Parser
    └─ Parse JSON, limit size to 10mb
    ↓
5. Route-specific Middleware
    └─ protect() for authenticated routes
    └─ authorize() for admin routes
    ↓
6. Controller (Business Logic)
    ↓
Response
```

### 11.2 CORS Configuration Explained

**Problem:** Browser blocks requests from different origins

```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
         ↑
         Different ports = Different origins = Blocked by browser
```

**Solution:** Configure CORS

```javascript
// backend/index.js

const allowedOrigins = [
    'http://localhost:3000',              // Development
    'https://cheerful-cannoli-94af42.netlify.app',  // Netlify
    'https://foodfreaky.in',              // Production domain
    'https://www.foodfreaky.in'           // Production www
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'CORS policy does not allow access from this origin.';
            return callback(new Error(msg), false);
        }
        
        return callback(null, true);
    },
    credentials: true,  // Allow cookies
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 11.3 Rate Limiting

Prevents abuse by limiting requests:

```javascript
// backend/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// General API limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // Max 100 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter limiter for auth endpoints
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // Max 5 login attempts
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true  // Don't count successful logins
});

// Registration limiter
exports.registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3,                     // Max 3 registrations per hour per IP
    message: 'Too many accounts created, please try again later.'
});
```

**Usage:**
```javascript
// Apply to routes
router.post('/login', authLimiter, login);
router.post('/register', registrationLimiter, register);
```

### 11.4 JWT Token Security

**Token Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header                              Payload                                Signature
└─ Algorithm: HS256                └─ User data + timestamps             └─ Verification
```

**How It Works:**

1. **Creation (Login):**
```javascript
const token = jwt.sign(
    { id: user._id, email: user.email },  // Payload
    process.env.JWT_SECRET,                // Secret key
    { expiresIn: '1h' }                   // Expiry
);
```

2. **Verification (Protected Routes):**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// If signature is invalid or token expired, throws error
```

3. **Token Expiry:**
```javascript
// Token contains:
{
    id: "507f...",
    email: "user@example.com",
    iat: 1640995200,  // Issued at (Unix timestamp)
    exp: 1640998800   // Expires at (Unix timestamp)
}

// Backend checks:
if (Date.now() > decoded.exp * 1000) {
    throw new Error('Token expired');
}
```

### 11.5 Password Security

**Hashing Process:**
```javascript
// When user registers or changes password

// 1. Generate salt (random string)
const salt = await bcrypt.genSalt(10);
// Example: "$2a$10$N9qo8uLOickgx2ZMRZoMye"

// 2. Hash password with salt
const hashedPassword = await bcrypt.hash(password, salt);
// Example: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// 3. Store hashed password (NEVER store plain password)
user.password = hashedPassword;
```

**Password Verification:**
```javascript
// When user logs in

// 1. Get stored hashed password
const user = await User.findOne({ email }).select('+password');

// 2. Compare provided password with hash
const isMatch = await bcrypt.compare(providedPassword, user.password);

// 3. Grant access if match
if (isMatch) {
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
}
```

**Why this is secure:**
- Same password + different salt = different hash
- Hash cannot be reversed to get original password
- Even if database is compromised, passwords are safe

### 11.6 Input Validation

**Mongoose Schema Validation:**
```javascript
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^\+?[\d\s-]+$/, 'Please provide a valid contact number']
    }
});
```

**Controller Validation:**
```javascript
exports.createOrder = async (req, res) => {
    const { items, shippingAddress } = req.body;
    
    // Validate required fields
    if (!items || items.length === 0) {
        return res.status(400).json({ msg: 'Order items are required' });
    }
    
    if (!shippingAddress || shippingAddress.trim().length === 0) {
        return res.status(400).json({ msg: 'Shipping address is required' });
    }
    
    // Validate item structure
    for (const item of items) {
        if (!item.name || !item.price || !item.quantity) {
            return res.status(400).json({ msg: 'Invalid item data' });
        }
        
        if (item.quantity < 1) {
            return res.status(400).json({ msg: 'Quantity must be at least 1' });
        }
    }
    
    // Proceed with order creation
    // ...
};
```

---

## 12. Email & PDF Generation

### 12.1 Email Service Setup

```javascript
// backend/utils/sendEmail.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create transporter (email service connection)
    const transporter = nodemailer.createTransport({
        service: 'gmail',  // Use Gmail SMTP
        auth: {
            user: process.env.EMAIL_USERNAME,     // your-email@gmail.com
            pass: process.env.EMAIL_PASSWORD      // App-specific password
        }
    });
    
    // 2. Define email options
    const mailOptions = {
        from: `FoodFreaky <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments  // Optional PDF attachments
    };
    
    // 3. Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
```

**Gmail Setup:**
1. Enable 2-factor authentication on Gmail
2. Generate App Password:
   - Google Account → Security → App Passwords
   - Select "Mail" and your device
   - Copy generated password
3. Use in `.env`:
   ```
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-here
   ```

### 12.2 OTP Email Example

```javascript
// backend/controllers/auth.js

const otp = generateOTP();  // Returns 6-digit number like 123456

const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to FoodFreaky!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f97316; color: white; padding: 15px; 
                    text-align: center; font-size: 24px; border-radius: 5px;">
            ${otp}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            © 2025 FoodFreaky. All rights reserved.
        </p>
    </div>
`;

await sendEmail({
    email: user.email,
    subject: 'FoodFreaky - Email Verification',
    html: message
});
```

### 12.3 PDF Invoice Generation

```javascript
// backend/utils/generateInvoicePdf.js

const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoicePdf = async (order, user, restaurant) => {
    return new Promise((resolve, reject) => {
        // 1. Create new PDF document
        const doc = new PDFDocument({ margin: 50 });
        
        // 2. Create write stream
        const filename = `invoice-${order._id}.pdf`;
        const stream = fs.createWriteStream(filename);
        doc.pipe(stream);
        
        // 3. Add content
        
        // Header
        doc.fontSize(20)
           .text('FoodFreaky', 50, 50)
           .fontSize(10)
           .text('Food Delivery Service', 50, 75);
        
        // Invoice title
        doc.fontSize(16)
           .text('INVOICE', 400, 50);
        
        doc.fontSize(10)
           .text(`Order ID: ${order._id}`, 400, 70)
           .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 85);
        
        // Customer details
        doc.fontSize(12)
           .text('Bill To:', 50, 150)
           .fontSize(10)
           .text(user.name, 50, 170)
           .text(user.email, 50, 185)
           .text(order.shippingAddress, 50, 200);
        
        // Restaurant details
        doc.fontSize(12)
           .text('From:', 300, 150)
           .fontSize(10)
           .text(restaurant.name, 300, 170)
           .text(restaurant.cuisine, 300, 185);
        
        // Items table
        let y = 250;
        doc.fontSize(12)
           .text('Item', 50, y)
           .text('Qty', 300, y)
           .text('Price', 400, y)
           .text('Total', 480, y);
        
        // Draw line
        doc.moveTo(50, y + 15)
           .lineTo(550, y + 15)
           .stroke();
        
        y += 30;
        
        // List items
        doc.fontSize(10);
        order.items.forEach(item => {
            doc.text(item.name, 50, y)
               .text(item.quantity.toString(), 300, y)
               .text(`₹${item.price}`, 400, y)
               .text(`₹${item.price * item.quantity}`, 480, y);
            y += 20;
        });
        
        // Draw line
        y += 10;
        doc.moveTo(50, y)
           .lineTo(550, y)
           .stroke();
        
        // Totals
        y += 20;
        doc.text('Subtotal:', 400, y)
           .text(`₹${order.itemsPrice}`, 480, y);
        
        y += 20;
        doc.text('Tax (5%):', 400, y)
           .text(`₹${order.taxPrice}`, 480, y);
        
        y += 20;
        doc.text('Delivery:', 400, y)
           .text(`₹${order.shippingPrice}`, 480, y);
        
        if (order.couponUsed) {
            y += 20;
            doc.fillColor('green')
               .text(`Coupon (${order.couponUsed}):`, 400, y)
               .text(`-₹${order.discountAmount || 0}`, 480, y)
               .fillColor('black');
        }
        
        // Draw line
        y += 15;
        doc.moveTo(400, y)
           .lineTo(550, y)
           .stroke();
        
        // Grand total
        y += 20;
        doc.fontSize(12)
           .text('TOTAL:', 400, y)
           .text(`₹${order.totalPrice}`, 480, y);
        
        // Footer
        doc.fontSize(8)
           .text('Thank you for your order!', 50, 700, {
               align: 'center',
               width: 500
           });
        
        // 4. Finalize PDF
        doc.end();
        
        // 5. Resolve when stream finishes
        stream.on('finish', () => {
            resolve(filename);
        });
        
        stream.on('error', reject);
    });
};

module.exports = generateInvoicePdf;
```

**Usage:**
```javascript
// After order is placed
const pdfPath = await generateInvoicePdf(order, user, restaurant);

// Send email with PDF attachment
await sendEmail({
    email: user.email,
    subject: 'Your FoodFreaky Order Invoice',
    html: `<p>Thank you for your order! Your invoice is attached.</p>`,
    attachments: [{
        filename: 'invoice.pdf',
        path: pdfPath
    }]
});

// Clean up PDF file
fs.unlinkSync(pdfPath);
```


---

## 13. Error Handling Patterns

### 13.1 Backend Error Handler

```javascript
// backend/middleware/errorHandler.js

class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    
    // Log error for debugging
    console.error(err);
    
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ErrorResponse(message, 404);
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new ErrorResponse(message, 400);
    }
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map(val => val.message)
            .join(', ');
        error = new ErrorResponse(message, 400);
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ErrorResponse('Invalid token', 401);
    }
    
    if (err.name === 'TokenExpiredError') {
        error = new ErrorResponse('Token expired', 401);
    }
    
    // Send response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { ErrorResponse, errorHandler };
```

### 13.2 Frontend Error Boundary

```javascript
// frontend/src/components/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        // Log error to monitoring service
        console.error('Error caught by boundary:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-container">
                    <h1>Oops! Something went wrong.</h1>
                    <p>We're sorry for the inconvenience.</p>
                    {process.env.NODE_ENV === 'development' && (
                        <details>
                            <summary>Error Details</summary>
                            <pre>{this.state.error?.toString()}</pre>
                        </details>
                    )}
                    <button onClick={() => window.location.reload()}>
                        Reload Page
                    </button>
                </div>
            );
        }
        
        return this.props.children;
    }
}

export default ErrorBoundary;
```

**Usage:**
```javascript
// Wrap your app
<ErrorBoundary>
    <App />
</ErrorBoundary>
```

---

## 14. Code Examples & Walkthroughs

### 14.1 Complete User Registration Flow

**Frontend:**
```javascript
// RegisterPage.jsx
const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: ''
});
const [showOtpForm, setShowOtpForm] = useState(false);
const [otp, setOtp] = useState('');

const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
        // Step 1: Send registration data
        const response = await axios.post('/api/auth/register', formData);
        
        // Step 2: Show OTP form
        setShowOtpForm(true);
        setMessage('OTP sent to your email. Please check your inbox.');
        
    } catch (error) {
        setError(error.response?.data?.msg || 'Registration failed');
    }
};

const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    try {
        // Step 3: Verify OTP
        const response = await axios.post('/api/auth/verify-otp', {
            email: formData.email,
            otp
        });
        
        // Step 4: Store token and user
        localStorage.setItem('authToken', response.data.token);
        
        // Step 5: Redirect to dashboard
        navigate('/dashboard');
        
    } catch (error) {
        setError(error.response?.data?.msg || 'Invalid OTP');
    }
};

return (
    <div>
        {!showOtpForm ? (
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                />
                <input
                    type="tel"
                    placeholder="Contact Number"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    required
                />
                <button type="submit">Register</button>
            </form>
        ) : (
            <form onSubmit={handleVerifyOtp}>
                <p>Enter the 6-digit OTP sent to {formData.email}</p>
                <input
                    type="text"
                    placeholder="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                />
                <button type="submit">Verify OTP</button>
            </form>
        )}
    </div>
);
```

### 14.2 Complete Order Placement Flow

**Frontend:**
```javascript
// CheckoutPage.jsx
const { cartItems, clearCart } = useCart();
const { user, authToken } = useAuth();
const [shippingAddress, setShippingAddress] = useState('');
const [couponCode, setCouponCode] = useState('');
const [appliedCoupon, setAppliedCoupon] = useState(null);

// Calculate prices
const itemsPrice = cartItems.reduce((acc, item) => 
    acc + (item.price * item.quantity), 0
);
const taxPrice = itemsPrice * 0.05;  // 5% GST
const shippingPrice = 40;

let totalPrice = itemsPrice + taxPrice + shippingPrice;

// Apply coupon discount
if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
        totalPrice -= (itemsPrice * appliedCoupon.value) / 100;
    } else {
        totalPrice -= appliedCoupon.value;
    }
}

const handleApplyCoupon = async () => {
    try {
        const response = await axios.post('/api/coupons/validate', {
            code: couponCode,
            orderValue: itemsPrice
        });
        
        setAppliedCoupon(response.data.data);
        setMessage(`Coupon applied! You saved ₹${response.data.discount}`);
        
    } catch (error) {
        setError(error.response?.data?.msg || 'Invalid coupon');
    }
};

const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    try {
        const orderData = {
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            restaurant: cartItems[0].restaurant.id,
            shippingAddress,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponUsed: appliedCoupon?.code || null
        };
        
        const response = await axios.post('/api/orders', orderData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        // Clear cart
        clearCart();
        
        // Show success and redirect
        setShowSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
        
    } catch (error) {
        setError(error.response?.data?.msg || 'Failed to place order');
    }
};

return (
    <div className="checkout-page">
        <h1>Checkout</h1>
        
        {/* Order Summary */}
        <div className="order-summary">
            <h2>Order Summary</h2>
            {cartItems.map(item => (
                <div key={item.name}>
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                </div>
            ))}
            
            <div className="totals">
                <div>Subtotal: ₹{itemsPrice}</div>
                <div>Tax (5%): ₹{taxPrice.toFixed(2)}</div>
                <div>Delivery: ₹{shippingPrice}</div>
                {appliedCoupon && (
                    <div className="discount">
                        Discount: -₹{/* calculate discount */}
                    </div>
                )}
                <div className="total">Total: ₹{totalPrice.toFixed(2)}</div>
            </div>
        </div>
        
        {/* Coupon Section */}
        <div className="coupon-section">
            <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <button onClick={handleApplyCoupon}>Apply</button>
        </div>
        
        {/* Checkout Form */}
        <form onSubmit={handlePlaceOrder}>
            <h2>Delivery Address</h2>
            <textarea
                placeholder="Enter your complete address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                rows={4}
            />
            
            <button type="submit" className="place-order-btn">
                Place Order - ₹{totalPrice.toFixed(2)}
            </button>
        </form>
    </div>
);
```

---

## 15. Common Patterns & Best Practices

### 15.1 React Component Patterns

**Container/Presentational Pattern:**
```javascript
// Container component (logic)
const RestaurantPageContainer = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchRestaurants().then(data => {
            setRestaurants(data);
            setLoading(false);
        });
    }, []);
    
    return <RestaurantPagePresentation 
        restaurants={restaurants} 
        loading={loading} 
    />;
};

// Presentational component (UI)
const RestaurantPagePresentation = ({ restaurants, loading }) => {
    if (loading) return <Spinner />;
    
    return (
        <div>
            {restaurants.map(r => <RestaurantCard key={r._id} {...r} />)}
        </div>
    );
};
```

**Custom Hooks Pattern:**
```javascript
// Custom hook for data fetching
const useRestaurants = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/restaurants');
                setRestaurants(response.data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);
    
    return { restaurants, loading, error };
};

// Usage
const RestaurantPage = () => {
    const { restaurants, loading, error } = useRestaurants();
    
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    
    return <RestaurantList restaurants={restaurants} />;
};
```

### 15.2 Backend Patterns

**Controller Pattern:**
```javascript
// Keep controllers thin, move logic to services

// ❌ Bad - logic in controller
exports.createOrder = async (req, res) => {
    const itemsPrice = req.body.items.reduce((acc, item) => 
        acc + (item.price * item.quantity), 0
    );
    const taxPrice = itemsPrice * 0.05;
    // ... lots of calculation logic
};

// ✅ Good - use service layer
exports.createOrder = async (req, res) => {
    try {
        const order = await OrderService.createOrder(req.body, req.user);
        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

// services/OrderService.js
class OrderService {
    static async createOrder(orderData, user) {
        // All business logic here
        const prices = this.calculatePrices(orderData);
        const order = await Order.create({ ...orderData, ...prices });
        await this.sendConfirmationEmail(user, order);
        return order;
    }
    
    static calculatePrices(orderData) {
        // Price calculation logic
    }
    
    static async sendConfirmationEmail(user, order) {
        // Email logic
    }
}
```

**Async Error Handling:**
```javascript
// Wrapper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
exports.getRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find();
    res.json({ success: true, data: restaurants });
    // No try-catch needed!
});
```

### 15.3 Database Best Practices

**Use Indexes:**
```javascript
// Add indexes for frequently queried fields
UserSchema.index({ email: 1 });  // 1 = ascending
OrderSchema.index({ user: 1, createdAt: -1 });  // -1 = descending
RestaurantSchema.index({ cuisine: 1, tags: 1 });
```

**Use Lean Queries:**
```javascript
// ❌ Returns Mongoose document (heavy)
const restaurants = await Restaurant.find();

// ✅ Returns plain JavaScript object (lighter)
const restaurants = await Restaurant.find().lean();
```

**Select Only Needed Fields:**
```javascript
// ❌ Get all fields
const user = await User.findById(id);

// ✅ Get only needed fields
const user = await User.findById(id).select('name email role');
```

### 15.4 Security Best Practices

**Environment Variables:**
```javascript
// ❌ Never hardcode secrets
const token = jwt.sign(payload, 'my-secret-key');

// ✅ Use environment variables
const token = jwt.sign(payload, process.env.JWT_SECRET);
```

**Input Sanitization:**
```javascript
// Sanitize user input
const sanitizeInput = (input) => {
    return input.trim().replace(/[<>]/g, '');
};

const shippingAddress = sanitizeInput(req.body.shippingAddress);
```

**Validate User Ownership:**
```javascript
// ❌ Don't trust client
exports.cancelOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    await order.remove();  // Anyone can cancel any order!
};

// ✅ Verify ownership
exports.cancelOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized' });
    }
    
    await order.remove();
};
```

---

## 16. Troubleshooting Guide

### 16.1 Common Issues & Solutions

**Issue: CORS Error**
```
Error: Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:**
- Check backend CORS configuration
- Verify frontend URL is in allowedOrigins
- Check if credentials: true is set if using cookies

**Issue: Token Expired**
```
Error: 401 Unauthorized - Token expired
```
**Solution:**
- User needs to log in again
- Frontend should catch 401 and redirect to login
- Implement token refresh mechanism

**Issue: Mongoose CastError**
```
Error: Cast to ObjectId failed for value "abc" at path "_id"
```
**Solution:**
- Validate ID format before querying
- Use try-catch or error handler
```javascript
if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid ID format' });
}
```

### 16.2 Debugging Tips

**Backend Debugging:**
```javascript
// Add console.logs at key points
exports.createOrder = async (req, res) => {
    console.log('1. Request body:', req.body);
    console.log('2. User:', req.user);
    
    const order = await Order.create(req.body);
    console.log('3. Created order:', order);
    
    res.json(order);
};
```

**Frontend Debugging:**
```javascript
// Use React DevTools
// Check component state and props

// Console log API responses
axios.get('/api/restaurants')
    .then(response => {
        console.log('Response:', response);
        console.log('Data:', response.data);
    })
    .catch(error => {
        console.log('Error:', error);
        console.log('Error response:', error.response);
    });
```

---

## Conclusion

This guide has covered everything in FoodFreaky from basic concepts to advanced patterns. Here's what we learned:

✅ **Architecture** - How frontend, backend, and database work together
✅ **Request-Response Flow** - Complete journey of a request
✅ **Authentication** - Registration, login, JWT tokens, password hashing
✅ **State Management** - Context API for global state
✅ **API Communication** - Axios setup and patterns
✅ **Database** - MongoDB models and relationships
✅ **Security** - CORS, rate limiting, JWT, password hashing
✅ **Email & PDF** - Nodemailer and PDFKit integration
✅ **Error Handling** - Frontend and backend patterns
✅ **Best Practices** - Common patterns and security tips

### Next Steps

1. **Experiment** - Try modifying features
2. **Build** - Add new features using these patterns
3. **Read Documentation** - Check other docs/ files for specifics
4. **Test** - Always test your changes
5. **Deploy** - Take it to production!

### Additional Resources

- **API Reference**: See `docs/API.md`
- **Backend Details**: See `docs/BACKEND.md`
- **Frontend Details**: See `docs/FRONTEND.md`
- **Database Schema**: See `docs/DATABASE.md`
- **Improvements**: See `docs/IMPROVEMENTS.md`

Happy coding! 🚀
