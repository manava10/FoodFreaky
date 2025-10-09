# FoodFreaky - Technical Interview Questions & Answers

This document contains comprehensive interview questions based on the FoodFreaky repository implementation, covering various aspects of full-stack development.

---

## Table of Contents
1. [Backend Development (Node.js/Express)](#backend-development)
2. [Frontend Development (React)](#frontend-development)
3. [Database (MongoDB/Mongoose)](#database)
4. [Authentication & Security](#authentication--security)
5. [API Design & Best Practices](#api-design)
6. [System Design](#system-design)
7. [DevOps & Deployment](#devops--deployment)

---

## Backend Development (Node.js/Express)

### Q1: Explain the middleware pattern used in Express.js. How is it implemented in this project?

**Answer:**
Middleware functions are functions that have access to the request object (req), response object (res), and the next middleware function in the application's request-response cycle.

**Implementation in FoodFreaky:**
```javascript
// Authentication middleware (backend/middleware/auth.js)
exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, msg: 'Not authorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next(); // Pass control to next middleware
    } catch (error) {
        res.status(401).json({ msg: 'Not authorized, token failed' });
    }
};
```

**Key Points:**
- Middleware can modify req/res objects
- `next()` passes control to the next middleware
- Order of middleware matters
- Can be route-specific or global

---

### Q2: What is rate limiting and why is it important? How is it implemented in this project?

**Answer:**
Rate limiting restricts the number of API requests a client can make within a specific time window, preventing abuse and DDoS attacks.

**Implementation:**
```javascript
// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});
```

**Benefits:**
- Prevents brute force attacks
- Protects against DDoS
- Ensures fair resource usage
- Improves API stability

---

### Q3: Explain the difference between synchronous and asynchronous operations. How does async/await work?

**Answer:**
- **Synchronous:** Operations execute sequentially, blocking the next operation until complete
- **Asynchronous:** Operations can run concurrently without blocking

**async/await Implementation:**
```javascript
// backend/controllers/auth.js
exports.register = async (req, res) => {
    try {
        const user = await User.findOne({ email }); // Wait for DB query
        const otp = generateOTP();
        await sendEmail({ email, subject: 'Verification', html: message });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};
```

**Key Points:**
- `async` keyword makes function return a Promise
- `await` pauses execution until Promise resolves
- Better error handling with try/catch
- Cleaner than callback chains

---

### Q4: What is CORS and why is it needed? How is it configured in this project?

**Answer:**
CORS (Cross-Origin Resource Sharing) is a security feature that controls which domains can access your API.

**Implementation:**
```javascript
// backend/index.js
const allowedOrigins = [
    'http://localhost:3000',
    'https://foodfreaky.in',
    'https://www.foodfreaky.in'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    }
};
app.use(cors(corsOptions));
```

**Why needed:**
- Browsers block cross-origin requests by default
- Security measure to prevent unauthorized access
- Allows controlled access from specific domains

---

### Q5: Explain the concept of environment variables and their importance.

**Answer:**
Environment variables store configuration values outside of code, enabling different settings for different environments.

**Usage in FoodFreaky:**
```javascript
// backend/index.js
dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
```

**Benefits:**
- Separates configuration from code
- Keeps sensitive data secure
- Easy environment-specific configuration
- No need to modify code for different deployments

**Best Practices:**
- Never commit .env files to version control
- Use different .env files for dev/staging/production
- Validate required environment variables on startup

---

## Frontend Development (React)

### Q6: What is React Context API and when should you use it?

**Answer:**
Context API provides a way to share data across component tree without prop drilling.

**Implementation in FoodFreaky:**
```javascript
// frontend/src/context/AuthContext.js
const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    
    const login = async (email, password) => {
        const { data } = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
    };
    
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
```

**When to use:**
- Global state (auth, theme, language)
- Avoid prop drilling through many levels
- State needed by many components

**When NOT to use:**
- Frequently changing data (performance issues)
- Simple parent-child communication
- Consider Redux for complex state management

---

### Q7: Explain React Hooks - useState, useEffect, and useContext.

**Answer:**

**useState:** Manages component state
```javascript
const [count, setCount] = useState(0);
setCount(count + 1);
```

**useEffect:** Handles side effects (API calls, subscriptions)
```javascript
// frontend/src/context/AuthContext.js
useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 < Date.now()) {
                logout(); // Token expired
            } else {
                setUser(decoded);
            }
        } catch (error) {
            logout();
        }
    }
}, []); // Empty dependency array = run once on mount
```

**useContext:** Access context values
```javascript
const { user, login, logout } = useAuth();
```

**Key Points:**
- Hooks must be called at top level (not in loops/conditions)
- Dependency arrays control when effects run
- Custom hooks can encapsulate reusable logic

---

### Q8: What is Protected Route and how do you implement it in React Router?

**Answer:**
Protected routes restrict access to authenticated users only.

**Implementation:**
```javascript
// frontend/src/ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

// Usage in App.js
<Route 
    path="/dashboard"
    element={
        <ProtectedRoute>
            <DashboardPage />
        </ProtectedRoute>
    } 
/>
```

**Benefits:**
- Centralized authentication logic
- Prevents unauthorized access
- Redirects to login automatically
- Can be extended for role-based access

---

### Q9: Explain the concept of lifting state up in React.

**Answer:**
Lifting state up means moving state to the closest common ancestor of components that need it.

**Example from FoodFreaky:**
```javascript
// CartContext manages cart state at top level
export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    
    const addToCart = (item, restaurant) => {
        setCartItems([...cartItems, item]);
    };
    
    return (
        <CartContext.Provider value={{ cartItems, addToCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Multiple components can access cart
function RestaurantMenu() {
    const { addToCart } = useCart();
    return <button onClick={() => addToCart(item)}>Add</button>;
}

function Cart() {
    const { cartItems } = useCart();
    return <div>{cartItems.length} items</div>;
}
```

**When to lift state:**
- Multiple components need same data
- Components need to modify shared state
- Synchronize state across components

---

### Q10: What is localStorage and how is it used for persistence?

**Answer:**
localStorage is a browser API for storing key-value pairs persistently.

**Implementation:**
```javascript
// frontend/src/context/CartContext.js
const [cartItems, setCartItems] = useState(() => {
    try {
        const localData = localStorage.getItem('cartItems');
        return localData ? JSON.parse(localData) : [];
    } catch (error) {
        return [];
    }
});

useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}, [cartItems]);
```

**Key Points:**
- Data persists across browser sessions
- Store strings only (use JSON.stringify/parse)
- 5-10MB storage limit
- Synchronous API
- Not secure for sensitive data (use for non-sensitive data only)

---

## Database (MongoDB/Mongoose)

### Q11: What is MongoDB and how does it differ from SQL databases?

**Answer:**

**MongoDB (NoSQL):**
- Document-oriented (JSON-like)
- Flexible schema
- Horizontal scaling
- No joins (use references or embedding)

**SQL Databases:**
- Table-based (rows/columns)
- Fixed schema
- Vertical scaling
- Joins for relationships

**Example Schema:**
```javascript
// backend/models/User.js
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, minlength: 6 },
    role: { 
        type: String, 
        enum: ['user', 'deliveryadmin', 'admin'],
        default: 'user' 
    },
    createdAt: { type: Date, default: Date.now }
});
```

**When to use MongoDB:**
- Flexible/changing schema
- Hierarchical data
- Rapid development
- Horizontal scaling needs

---

### Q12: What are Mongoose schemas and models? Explain indexing.

**Answer:**

**Schema:** Defines the structure of documents
```javascript
const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    cuisine: { type: String, required: true },
    menu: [MenuSchema],
    averageRating: { type: Number, default: 0 }
}, { timestamps: true });
```

**Model:** Provides interface for querying database
```javascript
module.exports = mongoose.model('Restaurant', RestaurantSchema);
```

**Indexing:** Improves query performance
```javascript
// backend/models/Restaurant.js
RestaurantSchema.index({ cuisine: 1 }); // Single field
RestaurantSchema.index({ tags: 1 });
RestaurantSchema.index({ averageRating: -1 }); // Descending

// Note: unique:true automatically creates index
```

**Benefits of Indexing:**
- Faster queries
- Efficient sorting
- Better performance on large datasets

**Trade-offs:**
- Slower writes
- More storage space

---

### Q13: Explain Mongoose middleware (pre/post hooks).

**Answer:**
Middleware functions execute before or after certain operations.

**Implementation:**
```javascript
// backend/models/User.js
// Pre-save hook: Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
```

**Types:**
- **pre:** Execute before operation
- **post:** Execute after operation

**Common use cases:**
- Password hashing
- Data validation
- Timestamp updates
- Cascade deletes
- Logging

---

### Q14: What are references vs embedded documents in MongoDB?

**Answer:**

**References (Normalization):**
```javascript
// backend/models/Order.js
const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
});

// Populate to get full data
const order = await Order.findById(id)
    .populate('user')
    .populate('restaurant');
```

**Embedded Documents:**
```javascript
// backend/models/Restaurant.js
const MenuSchema = new mongoose.Schema({
    category: String,
    items: [{
        name: String,
        price: Number
    }]
});

const RestaurantSchema = new mongoose.Schema({
    name: String,
    menu: [MenuSchema] // Embedded
});
```

**When to use References:**
- Data shared across documents
- Large documents
- Data changes frequently

**When to use Embedding:**
- Data always accessed together
- One-to-few relationships
- Better read performance

---

### Q15: Explain MongoDB query optimization techniques.

**Answer:**

**1. Use Indexes:**
```javascript
UserSchema.index({ email: 1 });
OrderSchema.index({ user: 1, createdAt: -1 });
```

**2. Limit Fields (Projection):**
```javascript
// Don't fetch password by default
password: { type: String, select: false }

// In queries
User.findOne({ email }).select('+password'); // Include password
User.find().select('name email'); // Only name and email
```

**3. Use Lean Queries:**
```javascript
// Returns plain JavaScript objects (faster)
const restaurants = await Restaurant.find().lean();
```

**4. Pagination:**
```javascript
const page = 1;
const limit = 10;
const skip = (page - 1) * limit;
const results = await Restaurant.find()
    .limit(limit)
    .skip(skip);
```

**5. Compound Indexes:**
```javascript
OrderSchema.index({ user: 1, createdAt: -1 });
```

---

## Authentication & Security

### Q16: Explain JWT (JSON Web Tokens) authentication.

**Answer:**
JWT is a compact, self-contained token for secure information transmission.

**Structure:** header.payload.signature

**Implementation:**
```javascript
// backend/controllers/auth.js
// Generate token
const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**How it works:**
1. User logs in with credentials
2. Server validates and creates JWT
3. Client stores JWT (localStorage/cookie)
4. Client sends JWT in Authorization header
5. Server verifies JWT and grants access

**Advantages:**
- Stateless (no server-side session storage)
- Scalable
- Self-contained
- Cross-domain authentication

**Security considerations:**
- Store securely (httpOnly cookies preferred)
- Use HTTPS
- Set expiration time
- Keep secret key secure

---

### Q17: What is password hashing and why use bcrypt?

**Answer:**
Hashing converts passwords into irreversible strings.

**Implementation:**
```javascript
// backend/models/User.js
const bcrypt = require('bcryptjs');

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
```

**Why bcrypt:**
- Slow algorithm (prevents brute force)
- Automatic salting
- Adaptive (can increase rounds as computers get faster)
- Industry standard

**Never:**
- Store plain text passwords
- Use simple hashing (MD5, SHA1)
- Share passwords between users

---

### Q18: Explain OTP (One-Time Password) implementation.

**Answer:**
OTP provides temporary verification codes for authentication.

**Implementation:**
```javascript
// backend/utils/generateOTP.js
const crypto = require('crypto');
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// backend/controllers/auth.js
const otp = generateOTP();
const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

user.otp = otp;
user.otpExpires = otpExpires;
await user.save();

// Send OTP via email
await sendEmail({
    email: user.email,
    subject: 'Email Verification',
    html: `<h2>${otp}</h2><p>Expires in 10 minutes</p>`
});

// Verify OTP
const user = await User.findOne({ 
    email, 
    otp, 
    otpExpires: { $gt: Date.now() } 
});
```

**Security considerations:**
- Short expiration time
- Single use
- Secure generation (crypto module)
- Rate limiting

---

### Q19: What is the purpose of Helmet middleware?

**Answer:**
Helmet sets various HTTP headers to protect against common vulnerabilities.

**Implementation:**
```javascript
// backend/index.js
const helmet = require('helmet');
app.use(helmet());
```

**Protection against:**
- **XSS (Cross-Site Scripting):** X-XSS-Protection header
- **Clickjacking:** X-Frame-Options header
- **MIME sniffing:** X-Content-Type-Options header
- **DNS prefetch control**
- **IE download options**

**Headers set:**
```
Content-Security-Policy
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
```

---

### Q20: Explain password reset token implementation.

**Answer:**
Password reset uses cryptographic tokens for secure password changes.

**Implementation:**
```javascript
// backend/models/User.js
UserSchema.methods.getResetPasswordToken = function() {
    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash and save
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expiration (5 minutes)
    this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
    
    return resetToken; // Send unhashed token to user
};

// Reset password flow
// 1. User requests reset
const resetToken = user.getResetPasswordToken();
await user.save();
const resetUrl = `${FRONTEND_URL}/reset/${resetToken}`;
await sendEmail({ email, resetUrl });

// 2. User clicks link with token
// 3. Verify hashed token
const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
});
```

**Security:**
- Tokens are hashed in database
- Short expiration time
- Single use only
- Rate limiting on requests

---

## API Design & Best Practices

### Q21: What are RESTful API principles?

**Answer:**
REST (Representational State Transfer) is an architectural style for APIs.

**Principles:**

1. **Resource-based URLs:**
```javascript
GET    /api/restaurants      // Get all restaurants
GET    /api/restaurants/:id  // Get specific restaurant
POST   /api/restaurants      // Create restaurant
PUT    /api/restaurants/:id  // Update restaurant
DELETE /api/restaurants/:id  // Delete restaurant
```

2. **HTTP Methods:**
- **GET:** Retrieve data
- **POST:** Create data
- **PUT/PATCH:** Update data
- **DELETE:** Remove data

3. **Stateless:** Each request independent

4. **Standard Status Codes:**
```javascript
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

**Implementation:**
```javascript
// backend/routes/restaurants.js
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', protect, authorize('admin'), createRestaurant);
router.put('/:id', protect, authorize('admin'), updateRestaurant);
router.delete('/:id', protect, authorize('admin'), deleteRestaurant);
```

---

### Q22: Explain error handling in Express.js.

**Answer:**
Centralized error handling improves code maintainability.

**Implementation:**
```javascript
// backend/middleware/errorHandler.js
exports.errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        error.message = 'Duplicate field value entered';
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors).map(val => val.message);
        error.statusCode = 400;
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

// Usage in index.js
app.use(errorHandler); // Must be after all routes
```

**Async Handler Pattern:**
```javascript
// backend/middleware/asyncHandler.js
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Usage
exports.getRestaurants = asyncHandler(async (req, res, next) => {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
});
```

---

### Q23: What is input validation and why is it important?

**Answer:**
Input validation ensures data integrity and security.

**Why important:**
- Prevent SQL/NoSQL injection
- Ensure data quality
- Better error messages
- Business logic enforcement

**Implementation with Joi:**
```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required()
});

// Validation middleware
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            msg: error.details[0].message 
        });
    }
    next();
};

// Usage
router.post('/register', validate(registerSchema), register);
```

**Mongoose Built-in Validation:**
```javascript
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [/^\w+@\w+\.\w{2,3}$/, 'Please add valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
});
```

---

### Q24: Explain API versioning and why it matters.

**Answer:**
API versioning allows changes without breaking existing clients.

**Methods:**

1. **URL Path:**
```javascript
/api/v1/restaurants
/api/v2/restaurants
```

2. **Query Parameter:**
```javascript
/api/restaurants?version=1
```

3. **Header:**
```javascript
Accept: application/vnd.company.v1+json
```

**Implementation:**
```javascript
// backend/index.js
const v1Routes = require('./routes/v1');
const v2Routes = require('./routes/v2');

app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

**Benefits:**
- Backward compatibility
- Gradual migration
- Support multiple clients
- Clear deprecation path

---

### Q25: What is pagination and why is it needed?

**Answer:**
Pagination divides large datasets into pages for better performance.

**Implementation:**
```javascript
// Pagination middleware
const pagination = (model) => async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    const results = {
        data: await model.find().limit(limit).skip(startIndex),
        pagination: {}
    };

    if (endIndex < total) {
        results.pagination.next = { page: page + 1, limit };
    }

    if (startIndex > 0) {
        results.pagination.prev = { page: page - 1, limit };
    }

    results.pagination.total = total;
    results.pagination.pages = Math.ceil(total / limit);

    req.pagination = results;
    next();
};

// Usage
router.get('/', pagination(Restaurant), getRestaurants);
```

**Benefits:**
- Faster response times
- Reduced bandwidth
- Better user experience
- Lower server load

---

## System Design

### Q26: Explain the MVC (Model-View-Controller) pattern.

**Answer:**
MVC separates application into three components.

**Architecture in FoodFreaky:**

```
Model (backend/models/)
├── User.js
├── Restaurant.js
└── Order.js

Controller (backend/controllers/)
├── auth.js
├── restaurants.js
└── orders.js

View (frontend/src/)
├── pages/
└── components/
```

**Model:** Data and business logic
```javascript
// backend/models/User.js
const UserSchema = new mongoose.Schema({...});
UserSchema.methods.matchPassword = function() {...};
```

**Controller:** Request handling
```javascript
// backend/controllers/auth.js
exports.login = async (req, res) => {
    const user = await User.findOne({ email });
    // Business logic
    res.json({ token, user });
};
```

**View:** User interface (React components)
```javascript
// frontend/src/pages/LoginPage.jsx
function LoginPage() {
    return <form>...</form>;
}
```

**Benefits:**
- Separation of concerns
- Easier testing
- Maintainable code
- Team collaboration

---

### Q27: What is the difference between monolithic and microservices architecture?

**Answer:**

**Monolithic (FoodFreaky's current architecture):**
```
┌─────────────────────────┐
│   Single Application    │
│  ┌──────────────────┐  │
│  │   Auth Module    │  │
│  │ Restaurant Module│  │
│  │   Order Module   │  │
│  │   Database       │  │
│  └──────────────────┘  │
└─────────────────────────┘
```

**Advantages:**
- Simple development
- Easy deployment
- Better performance (no network calls)
- Easier debugging

**Disadvantages:**
- Scaling challenges
- Technology lock-in
- Complex codebase
- Deployment affects entire system

**Microservices:**
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Auth    │  │Restaurant│  │  Order   │
│ Service  │  │ Service  │  │ Service  │
│  + DB    │  │  + DB    │  │  + DB    │
└──────────┘  └──────────┘  └──────────┘
```

**Advantages:**
- Independent scaling
- Technology flexibility
- Easier updates
- Better fault isolation

**Disadvantages:**
- Complex deployment
- Network latency
- Data consistency challenges
- More infrastructure

**When to use microservices:**
- Large teams
- Complex domains
- Need independent scaling
- Different technology requirements

---

### Q28: Explain caching strategies and their implementation.

**Answer:**
Caching stores frequently accessed data for faster retrieval.

**Types:**

**1. In-Memory Cache (Redis):**
```javascript
// backend/config/redis.js
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: 6379
});

// Cache middleware
const cache = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await client.get(key);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            // Store original send
            res.originalSend = res.send;
            res.send = (data) => {
                client.setEx(key, duration, data);
                res.originalSend(data);
            };
            
            next();
        } catch (error) {
            next();
        }
    };
};

// Usage
router.get('/restaurants', cache(300), getRestaurants);
```

**2. Browser Cache:**
```javascript
// Set cache headers
res.set('Cache-Control', 'public, max-age=300');
```

**3. Application-level Cache:**
```javascript
const cache = new Map();

function getCachedData(key, fetcher, ttl = 300000) {
    if (cache.has(key)) {
        const { data, timestamp } = cache.get(key);
        if (Date.now() - timestamp < ttl) {
            return data;
        }
    }
    
    const data = fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}
```

**Cache Strategies:**
- **Cache-Aside:** App manages cache
- **Write-Through:** Update DB and cache together
- **Write-Behind:** Update cache, async DB update
- **Refresh-Ahead:** Proactive cache refresh

---

### Q29: What is database connection pooling?

**Answer:**
Connection pooling reuses database connections instead of creating new ones.

**How it works:**
```
┌─────────┐     ┌──────────────┐     ┌──────────┐
│  App    │────▶│ Connection   │────▶│ MongoDB  │
│ Request │     │    Pool      │     │          │
└─────────┘     │ ┌──┐┌──┐┌──┐│     └──────────┘
                │ │C1││C2││C3││
                │ └──┘└──┘└──┘│
                └──────────────┘
```

**Mongoose Implementation:**
```javascript
// backend/config/db.js
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,        // Max connections
    minPoolSize: 5,         // Min connections
    socketTimeoutMS: 45000, // Close sockets after inactivity
});
```

**Benefits:**
- Reduced connection overhead
- Better resource utilization
- Improved performance
- Connection reuse

**Configuration considerations:**
- Pool size based on load
- Connection timeout
- Maximum wait time
- Idle connection timeout

---

### Q30: Explain the concept of real-time updates with WebSockets.

**Answer:**
WebSockets provide full-duplex communication between client and server.

**Implementation with Socket.io:**
```javascript
// backend/index.js
const socketio = require('socket.io');
const io = socketio(server, {
    cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
    console.log('User connected');
    
    // Join room for user's orders
    socket.on('join-orders', (userId) => {
        socket.join(`user-${userId}`);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Emit order status update
io.to(`user-${userId}`).emit('order-update', {
    orderId,
    status: 'Out for Delivery'
});

// frontend
import { io } from 'socket.io-client';

const socket = io(API_URL);

socket.on('connect', () => {
    socket.emit('join-orders', user.id);
});

socket.on('order-update', (data) => {
    // Update UI with new order status
    updateOrderStatus(data);
});
```

**Use cases:**
- Order status updates
- Live notifications
- Chat applications
- Live tracking
- Collaborative editing

**Advantages:**
- Real-time communication
- Lower latency than polling
- Bi-directional
- Efficient

---

## DevOps & Deployment

### Q31: Explain environment-based configuration.

**Answer:**
Different environments need different configurations.

**Setup:**
```
.env.development
.env.staging
.env.production
```

**Example:**
```bash
# .env.development
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/foodfreaky-dev
FRONTEND_URL=http://localhost:3000

# .env.production
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://prod-cluster/foodfreaky
FRONTEND_URL=https://foodfreaky.in
```

**Loading:**
```javascript
// backend/index.js
const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Or use different files
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config({ path: '.env.development' });
}
```

**Best practices:**
- Never commit .env files
- Use .env.example for documentation
- Validate required variables on startup
- Use separate databases per environment

---

### Q32: What is CI/CD and how would you implement it?

**Answer:**
CI/CD automates testing and deployment.

**CI (Continuous Integration):** Automatically test code changes
**CD (Continuous Deployment):** Automatically deploy passing builds

**GitHub Actions Implementation:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Run linter
        run: cd backend && npm run lint

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run tests
        run: cd frontend && npm test
      
      - name: Build
        run: cd frontend && npm run build

  deploy:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deploy commands here
```

**Benefits:**
- Early bug detection
- Automated testing
- Faster deployment
- Consistent builds
- Better collaboration

---

### Q33: Explain containerization with Docker.

**Answer:**
Docker packages applications with dependencies into containers.

**Dockerfile for Backend:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/foodfreaky
      - NODE_ENV=production
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
  
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

**Commands:**
```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Benefits:**
- Consistent environments
- Easy scaling
- Isolation
- Portable
- Version control for infrastructure

---

### Q34: What is load balancing and when is it needed?

**Answer:**
Load balancing distributes traffic across multiple servers.

**Architecture:**
```
                ┌─────────────┐
    Users ─────▶│Load Balancer│
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌────────┐    ┌────────┐    ┌────────┐
   │Server 1│    │Server 2│    │Server 3│
   └────────┘    └────────┘    └────────┘
```

**Nginx Configuration:**
```nginx
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Algorithms:**
- **Round Robin:** Sequential distribution
- **Least Connections:** Server with fewest connections
- **IP Hash:** Same client to same server
- **Weighted:** Based on server capacity

**When needed:**
- High traffic
- Redundancy
- Zero-downtime deployments
- Geographic distribution

---

### Q35: Explain monitoring and logging in production.

**Answer:**
Monitoring and logging help identify and debug issues.

**Logging with Winston:**
```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;

// Usage
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: err.message });
```

**Request Logging:**
```javascript
const morgan = require('morgan');

// Custom format
morgan.token('user-id', (req) => req.user?.id || 'anonymous');

app.use(morgan(':method :url :status :response-time ms - :user-id'));
```

**Monitoring Tools:**
- **Application Performance Monitoring (APM):**
  - New Relic
  - Datadog
  - Application Insights

- **Error Tracking:**
  - Sentry
  - Rollbar
  - Bugsnag

- **Infrastructure Monitoring:**
  - Prometheus + Grafana
  - CloudWatch
  - Uptime monitors

**Key Metrics:**
- Response time
- Error rate
- Request rate
- CPU/Memory usage
- Database query time

---

## Additional Advanced Topics

### Q36: Explain the concept of database transactions.

**Answer:**
Transactions ensure data consistency across multiple operations.

**ACID Properties:**
- **Atomicity:** All or nothing
- **Consistency:** Valid state transitions
- **Isolation:** Concurrent execution
- **Durability:** Permanent changes

**Implementation:**
```javascript
// Mongoose transactions
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Update restaurant rating
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    restaurant.numberOfReviews += 1;
    restaurant.averageRating = calculateNewRating();
    await restaurant.save({ session });
    
    // Save order with rating
    order.rating = rating;
    order.review = review;
    await order.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
} catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

**When to use:**
- Financial operations
- Inventory management
- Multi-document updates
- Data integrity critical

---

### Q37: What is event-driven architecture?

**Answer:**
Event-driven architecture uses events to trigger and communicate between services.

**Implementation with Event Emitters:**
```javascript
// backend/events/orderEvents.js
const EventEmitter = require('events');

class OrderEmitter extends EventEmitter {}
const orderEvents = new OrderEmitter();

// Emit event
orderEvents.emit('order:created', { orderId, userId, total });

// Listen to event
orderEvents.on('order:created', async (data) => {
    // Send confirmation email
    await sendEmail({
        to: user.email,
        subject: 'Order Confirmed',
        template: 'orderConfirmation',
        data
    });
    
    // Generate invoice
    await generateInvoice(data.orderId);
    
    // Update analytics
    await analytics.trackOrder(data);
});

module.exports = orderEvents;
```

**Benefits:**
- Decoupled components
- Scalable
- Asynchronous processing
- Easy to extend

**Use cases:**
- Order processing
- Notifications
- Analytics
- Webhooks

---

### Q38: Explain API rate limiting strategies.

**Answer:**
Rate limiting prevents API abuse and ensures fair usage.

**Strategies:**

**1. Fixed Window:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests'
});
```

**2. Sliding Window:**
```javascript
// Redis-based sliding window
const slidingWindowLimiter = async (req, res, next) => {
    const key = `rate:${req.ip}`;
    const now = Date.now();
    const window = 60000; // 1 minute
    const limit = 100;
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, now - window);
    
    // Count requests in window
    const count = await redis.zcard(key);
    
    if (count >= limit) {
        return res.status(429).json({ msg: 'Rate limit exceeded' });
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, 60);
    
    next();
};
```

**3. Token Bucket:**
```javascript
class TokenBucket {
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }
    
    refill() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        const tokensToAdd = timePassed * this.refillRate;
        
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    
    tryConsume(tokens = 1) {
        this.refill();
        
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        
        return false;
    }
}
```

**4. Different Limits for Different Users:**
```javascript
const dynamicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        if (req.user?.role === 'admin') return 1000;
        if (req.user?.role === 'premium') return 500;
        return 100;
    }
});
```

---

### Q39: What is SQL Injection and NoSQL Injection? How to prevent?

**Answer:**

**SQL Injection:**
```sql
-- Malicious input: ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1' AND password = '';
-- Returns all users!
```

**NoSQL Injection:**
```javascript
// Malicious input: { $gt: "" }
db.users.find({ email: req.body.email, password: { $gt: "" } });
// Returns user without password!
```

**Prevention:**

**1. Input Validation:**
```javascript
const Joi = require('joi');

const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const { error, value } = schema.validate(req.body);
```

**2. Sanitization:**
```javascript
const mongoSanitize = require('express-mongo-sanitize');

app.use(mongoSanitize()); // Removes $ and . from user input
```

**3. Type Checking:**
```javascript
if (typeof req.body.email !== 'string') {
    return res.status(400).json({ msg: 'Invalid input' });
}
```

**4. Prepared Statements (SQL):**
```javascript
// Parameterized query
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);
```

**5. Mongoose Schema Validation:**
```javascript
const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true,
        validate: {
            validator: (v) => /^\w+@\w+\.\w+$/.test(v),
            message: 'Invalid email'
        }
    }
});
```

---

### Q40: Explain the concept of code splitting and lazy loading in React.

**Answer:**
Code splitting breaks application into smaller chunks loaded on demand.

**Implementation:**
```javascript
// frontend/src/App.js
import React, { Suspense, lazy } from 'react';

// Lazy load components
const HomePage = lazy(() => import('./pages/HomePage'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Loading component
const LoadingSpinner = () => (
    <div className="loading-container">
        <div className="spinner"></div>
    </div>
);

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/restaurants" element={<RestaurantPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
        </Suspense>
    );
}
```

**Route-based splitting:**
```javascript
// Each route is a separate chunk
const routes = [
    { path: '/', component: lazy(() => import('./HomePage')) },
    { path: '/dashboard', component: lazy(() => import('./Dashboard')) }
];
```

**Component-based splitting:**
```javascript
// Heavy components loaded on demand
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
    const [showChart, setShowChart] = useState(false);
    
    return (
        <div>
            <button onClick={() => setShowChart(true)}>Show Chart</button>
            {showChart && (
                <Suspense fallback={<div>Loading chart...</div>}>
                    <HeavyChart />
                </Suspense>
            )}
        </div>
    );
}
```

**Benefits:**
- Smaller initial bundle
- Faster initial load
- Better user experience
- Reduced bandwidth usage

**Build output:**
```
main.chunk.js          // Core app
HomePage.chunk.js      // Home page
Dashboard.chunk.js     // Dashboard
```

---

## Conclusion

This document covers the major technical concepts implemented in the FoodFreaky repository. These questions and answers demonstrate understanding of:

- Backend development with Node.js/Express
- Frontend development with React
- Database design with MongoDB/Mongoose
- Authentication and security best practices
- API design and RESTful principles
- System design concepts
- DevOps and deployment strategies

Each answer includes practical code examples from the actual implementation, making them relevant for technical interviews focused on full-stack MERN development.

---

**Document prepared based on the FoodFreaky repository analysis**
**Repository:** https://github.com/manava10/FoodFreaky
**Last Updated:** January 2025
