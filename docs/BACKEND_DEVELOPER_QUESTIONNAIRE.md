# FoodFreaky - Backend Developer Interview Questionnaire

## Comprehensive Backend Developer Q&A for FoodFreaky Food Delivery Platform

---

## 1. Architecture & System Design

### Q1.1: What is the overall architecture of the FoodFreaky application?
**Answer:** FoodFreaky follows a **MERN stack architecture** (MongoDB, Express.js, React, Node.js) with a clear separation between frontend and backend:
- **Backend**: RESTful API built with Node.js and Express.js (v5.1.0)
- **Database**: MongoDB with Mongoose ODM for data modeling
- **Frontend**: React 19.1.1 with React Router for SPA navigation
- **Communication**: JSON-based REST APIs over HTTP/HTTPS
- **Deployment**: Backend can be deployed on cloud platforms (Railway, DigitalOcean, Heroku), frontend on Netlify

### Q1.2: Explain the backend folder structure and its purpose.
**Answer:** The backend follows a standard **MVC-like pattern**:
```
backend/
├── config/          # Database configuration (MongoDB connection)
├── controllers/     # Business logic and request handlers
├── middleware/      # Authentication, error handling, async wrappers
├── models/          # Mongoose schemas (User, Restaurant, Order, Coupon)
├── routes/          # API endpoint definitions
├── utils/           # Utility functions (email, OTP, PDF generation)
└── index.js         # Server entry point
```
This structure provides **separation of concerns**, making the code maintainable, testable, and scalable.

### Q1.3: What design patterns are used in this backend?
**Answer:**
1. **MVC Pattern**: Separation of routes, controllers, and models
2. **Middleware Pattern**: Express middleware for auth, error handling, CORS
3. **Repository Pattern**: Mongoose models abstract database operations
4. **Factory Pattern**: Used in generating tokens, OTPs, and PDFs
5. **Dependency Injection**: Controllers receive models and utilities as dependencies

---

## 2. Database Schema & Models

### Q2.1: Describe the User model and its key features.
**Answer:** The User model (`models/User.js`) includes:
```javascript
{
  name: String (required),
  email: String (unique, validated),
  contactNumber: String (required),
  password: String (hashed, minlength: 6, select: false),
  otp: String,
  otpExpires: Date,
  isVerified: Boolean (default: false),
  role: Enum ['user', 'deliveryadmin', 'admin'] (default: 'user'),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: Date
}
```
**Key Features:**
- **Password Hashing**: Pre-save hook with bcrypt (10 salt rounds)
- **Email Verification**: OTP-based verification with expiration
- **Role-Based Access**: Three distinct roles for authorization
- **Password Reset**: Crypto-based token generation
- **Indexes**: On email, resetPasswordToken, otp+otpExpires, role for performance

### Q2.2: Explain the Restaurant model structure.
**Answer:**
```javascript
{
  name: String (unique, required),
  cuisine: String (required),
  deliveryTime: String,
  tags: [String],
  imageUrl: String,
  menu: [MenuSchema],
  averageRating: Number (default: 0),
  numberOfReviews: Number (default: 0),
  isAcceptingOrders: Boolean (default: true),
  type: Enum ['restaurant', 'fruit_stall'] (default: 'restaurant')
}
```
**MenuSchema** (embedded):
```javascript
{
  category: String,
  items: [{
    name: String,
    price: Number,
    emoji: String,
    imageUrl: String
  }]
}
```
**Indexes**: name, cuisine, tags, averageRating, type for efficient querying.

### Q2.3: What is the Order model and what relationships does it have?
**Answer:**
```javascript
{
  user: ObjectId (ref: 'User'),
  restaurant: ObjectId (ref: 'Restaurant'),
  items: [{ name, quantity, price }],
  itemsPrice: Number,
  taxPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,
  couponUsed: String,
  shippingAddress: String,
  status: Enum (6 states),
  rating: Number (1-5),
  review: String,
  createdAt: Date
}
```
**Relationships:**
- **Many-to-One** with User (many orders per user)
- **Many-to-One** with Restaurant (many orders per restaurant)
**Status Flow:** Waiting for Acceptance → Accepted → Preparing Food → Out for Delivery → Delivered (or Cancelled)

### Q2.4: Explain the Coupon model and its validation logic.
**Answer:**
```javascript
{
  code: String (unique, uppercase),
  discountType: Enum ['percentage', 'fixed'],
  value: Number,
  expiresAt: Date,
  isActive: Boolean,
  usageLimit: Number (nullable),
  timesUsed: Number (default: 0)
}
```
**Validation Logic** (in controller):
1. Check if coupon exists and is active
2. Verify expiration date hasn't passed
3. Check usage limit hasn't been exceeded
4. Return discount details for cart calculation

---

## 3. Authentication & Authorization

### Q3.1: How is authentication implemented in FoodFreaky?
**Answer:** **JWT-based stateless authentication**:
1. **Registration**: User provides email/password → OTP sent via email → User verifies OTP → JWT token issued
2. **Login**: Email/password validated → JWT token issued (30-day expiration)
3. **Token Storage**: Frontend stores JWT in localStorage
4. **Protected Routes**: Middleware verifies JWT on each request

**JWT Payload:**
```javascript
{
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  contactNumber: user.contactNumber
}
```

### Q3.2: Explain the `protect` middleware.
**Answer:** (`middleware/auth.js`)
```javascript
exports.protect = async (req, res, next) => {
  // 1. Extract token from Authorization header (Bearer token)
  // 2. Verify token with JWT_SECRET
  // 3. Decode token to get user ID
  // 4. Fetch user from database and attach to req.user
  // 5. Call next() or return 401 Unauthorized
}
```
Used on routes like `POST /api/orders`, `GET /api/orders/myorders`

### Q3.3: How does role-based authorization work?
**Answer:** Using the `authorize` middleware:
```javascript
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    next();
  };
};
```
**Usage Example:**
```javascript
router.get('/admin/orders', protect, authorize('admin', 'deliveryadmin'), getAllOrders);
```
This ensures only admins and delivery admins can access order management.

### Q3.4: Describe the password reset flow.
**Answer:**
1. **Request Reset**: `POST /api/auth/forgotpassword` with email
   - Generates crypto token (20 random bytes)
   - Hashes token with SHA256, stores in `resetPasswordToken`
   - Sets `resetPasswordExpire` to 5 minutes from now
   - Sends reset link via email
2. **Reset Password**: `PUT /api/auth/resetpassword/:resettoken`
   - Hashes received token, finds user by hashed token
   - Verifies token hasn't expired
   - Updates password (auto-hashed by pre-save hook)
   - Clears reset token fields

---

## 4. API Endpoints & Routing

### Q4.1: List all major API routes and their purposes.
**Answer:**

**Authentication Routes** (`/api/auth`):
- `POST /register` - User registration
- `POST /verify-otp` - Email verification
- `POST /login` - User login
- `POST /forgotpassword` - Request password reset
- `PUT /resetpassword/:resettoken` - Reset password
- `GET /me` - Get current user (protected)

**Restaurant Routes** (`/api/restaurants`):
- `GET /` - Get all restaurants
- `GET /:id` - Get restaurant by ID with menu

**Order Routes** (`/api/orders`):
- `POST /` - Create new order (protected)
- `GET /myorders` - Get user's orders (protected)
- `PUT /:id/cancel` - Cancel order (protected)
- `GET /:id/invoice` - Download invoice PDF (protected)
- `PUT /:id/rate` - Rate completed order (protected)

**Admin Routes** (`/api/admin`):
- `GET /orders` - Get all orders (admin/deliveryadmin)
- `PUT /orders/:id` - Update order status (admin/deliveryadmin)
- Restaurant CRUD operations (admin only)
- User management (admin only)

**Coupon Routes** (`/api/coupons`):
- `POST /validate` - Validate coupon code (public)
- Admin CRUD for coupons (admin only)

### Q4.2: How is CORS configured and why?
**Answer:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://foodfreaky.in',
  'https://www.foodfreaky.in',
  // ... other production URLs
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  }
}));
```
**Purpose:** Prevents unauthorized frontends from accessing the API while allowing legitimate domains.

### Q4.3: Explain the order creation flow with custom delivery logic.
**Answer:** (`controllers/orders.js`)
```javascript
1. Extract order details from request body
2. Validate required fields (items, restaurant, address)
3. Fetch restaurant document to check type
4. Apply custom delivery pricing:
   - Fruit stalls: < ₹500 = ₹30, >= ₹500 = ₹50
   - Regular restaurants: ₹50 flat
5. Recalculate total price with adjusted shipping
6. Create order document
7. If coupon used, increment timesUsed counter
8. Return created order with 201 status
```
This demonstrates **business logic encapsulation** in the backend.

---

## 5. Security Implementation

### Q5.1: What security measures are implemented?
**Answer:**
1. **Helmet.js**: Sets secure HTTP headers (CSP, XSS protection, etc.)
2. **Password Hashing**: Bcrypt with 10 salt rounds, never store plain text
3. **JWT Authentication**: Stateless, tamper-proof tokens
4. **CORS Configuration**: Whitelist-based origin validation
5. **Email Domain Validation**: Only allow @gmail.com and @vitapstudent.ac.in
6. **Input Validation**: Mongoose schema validation
7. **Password Selection**: `select: false` on password field by default
8. **Token Expiration**: JWT tokens expire in 30 days
9. **OTP Expiration**: OTPs expire in 10 minutes
10. **Reset Token Expiration**: Password reset tokens expire in 5 minutes

### Q5.2: How is password security handled?
**Answer:**
```javascript
// Pre-save hook in User model
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next(); // Skip if password hasn't changed
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password comparison method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```
**Benefits:** 
- Rainbow table attacks ineffective (salted hashes)
- Each password gets unique salt
- Passwords never exposed in API responses

### Q5.3: What are the potential security vulnerabilities and how would you fix them?
**Answer:**

**Current Vulnerabilities:**
1. **No Rate Limiting**: Brute force attacks possible
   - **Fix**: Add `express-rate-limit` (5 attempts per 15 min on auth routes)
2. **Limited Input Validation**: Injection attacks possible
   - **Fix**: Implement Joi/express-validator for strict schema validation
3. **No CSRF Protection**: Cross-site request forgery possible
   - **Fix**: Add `csurf` middleware for token-based CSRF protection
4. **Dependency Vulnerabilities**: Outdated packages
   - **Fix**: Run `npm audit fix`, update to latest secure versions
5. **No SQL Injection Protection Beyond Mongoose**: Direct queries vulnerable
   - **Fix**: Use parameterized queries, sanitize user input
6. **Sensitive Data in Logs**: Console.log might expose tokens
   - **Fix**: Use Winston with log levels, sanitize logs

---

## 6. Third-Party Integrations

### Q6.1: How is email functionality implemented?
**Answer:** Using **Nodemailer** (`utils/sendEmail.js`):
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD // App-specific password
  }
});

await transporter.sendMail({
  from: 'FoodFreaky <email>',
  to: options.email,
  subject: options.subject,
  html: options.html,
  attachments: options.attachments // For PDF invoices
});
```
**Use Cases:**
- OTP verification emails
- Password reset emails
- Order confirmation with invoice PDF

### Q6.2: Explain the PDF invoice generation.
**Answer:** Using **PDFKit** (`utils/generateInvoicePdf.js`):
1. Create new PDFDocument
2. Add company header with logo/name
3. Add invoice number (order ID substring)
4. List order items with quantities and prices
5. Add subtotal, tax, shipping, coupon discount
6. Add total price
7. Generate buffer and return

**Triggered When:** Admin updates order status to "Delivered" → PDF attached to confirmation email

### Q6.3: What environment variables are required and why?
**Answer:**
```env
# Database
MONGO_URI - MongoDB connection string (security: credentials not hardcoded)

# Authentication
JWT_SECRET - Secret key for signing JWTs (security: must be random, 256+ bits)

# Email Service
EMAIL_SERVICE - gmail (modularity: can switch to SendGrid)
EMAIL_USERNAME - Sender email address
EMAIL_PASSWORD - App-specific password (security: not regular password)

# CORS
FRONTEND_URL - Frontend URL for CORS whitelist (flexibility: env-specific)

# Server
PORT - Server port (default: 5000)
NODE_ENV - development/production (feature toggling)
```

---

## 7. Error Handling & Middleware

### Q7.1: How is error handling implemented globally?
**Answer:** Custom error handler middleware (`middleware/errorHandler.js`):
```javascript
exports.errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ msg: err.message });
  }
  
  // Mongoose duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({ msg: 'Duplicate field value' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ msg: 'Invalid token' });
  }
  
  // Default 500 error
  res.status(500).json({ msg: 'Server Error' });
};
```
Mounted **after all routes** in `index.js`.

### Q7.2: What is the purpose of the asyncHandler middleware?
**Answer:** Wraps async route handlers to catch errors:
```javascript
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
**Without it:** Manual try-catch in every controller
**With it:** Errors automatically forwarded to global error handler

**Usage:**
```javascript
router.post('/', asyncHandler(createOrder));
```

### Q7.3: How does the application handle database connection failures?
**Answer:** In `config/db.js`:
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); // Exit with failure
  }
};
```
**Graceful Shutdown:** Process exits on connection failure, allowing container orchestrators (Docker, K8s) to restart.

---

## 8. Performance & Scalability

### Q8.1: What database indexing strategies are used?
**Answer:**

**User Model:**
```javascript
UserSchema.index({ email: 1 });
UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ otp: 1, otpExpires: 1 });
UserSchema.index({ role: 1 });
```

**Order Model:**
```javascript
OrderSchema.index({ user: 1 });
OrderSchema.index({ restaurant: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 }); // Compound
```

**Restaurant Model:**
```javascript
RestaurantSchema.index({ name: 1 });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ tags: 1 });
RestaurantSchema.index({ averageRating: -1 });
```

**Benefits:** Faster queries on filtered/sorted operations (O(log n) vs O(n))

### Q8.2: How would you optimize this application for high traffic?
**Answer:**

**1. Caching (Redis):**
```javascript
// Cache restaurant list (rarely changes)
const restaurants = await redis.get('restaurants:all');
if (!restaurants) {
  const data = await Restaurant.find();
  await redis.setex('restaurants:all', 3600, JSON.stringify(data));
  return data;
}
return JSON.parse(restaurants);
```

**2. Database Optimization:**
- Pagination for order lists
- Connection pooling (Mongoose default: 5 connections)
- Read replicas for heavy read operations

**3. Load Balancing:**
- Deploy multiple backend instances behind Nginx/ALB
- Sticky sessions for WebSocket (if implemented)

**4. CDN for Static Assets:**
- Move images to Cloudflare/AWS CloudFront
- Reduce server load

**5. Horizontal Scaling:**
- Stateless design (JWT) enables easy scaling
- Use message queues (RabbitMQ) for email sending

### Q8.3: What are the current performance bottlenecks?
**Answer:**
1. **Email Sending**: Blocks request until email sent
   - **Solution:** Use background job queue (Bull/Agenda)
2. **PDF Generation**: CPU-intensive, synchronous
   - **Solution:** Generate asynchronously, store in S3
3. **No Caching**: Database hit on every restaurant query
   - **Solution:** Redis caching layer
4. **Large Response Payloads**: Sending full order history
   - **Solution:** Implement pagination, field filtering
5. **Unoptimized Queries**: Missing compound indexes
   - **Solution:** Analyze slow queries with MongoDB profiler

---

## 9. Testing & Quality Assurance

### Q9.1: What testing strategy would you implement?
**Answer:**

**1. Unit Tests (Jest):**
```javascript
// Test password hashing
describe('User Model', () => {
  it('should hash password before saving', async () => {
    const user = new User({ password: 'test123' });
    await user.save();
    expect(user.password).not.toBe('test123');
  });
});
```

**2. Integration Tests (Supertest):**
```javascript
describe('POST /api/auth/login', () => {
  it('should return JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@gmail.com', password: 'password' })
      .expect(200);
    expect(res.body.token).toBeDefined();
  });
});
```

**3. E2E Tests (Cypress):**
- Full order flow: Browse → Add to cart → Checkout → Track

**4. Load Testing (Artillery):**
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - post:
        url: '/api/auth/login'
```

### Q9.2: How would you implement logging for production?
**Answer:** Replace `console.log` with **Winston**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Order created', { orderId: order._id, userId: user._id });
logger.error('Database connection failed', { error: err.message });
```

**Benefits:**
- Structured logs (JSON) for log aggregators (ELK, Datadog)
- Log levels (error, warn, info, debug)
- Persistent storage for debugging

---

## 10. Deployment & DevOps

### Q10.1: How would you deploy this application to production?
**Answer:**

**Backend Deployment (Railway/DigitalOcean):**
1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

2. Set environment variables in platform dashboard
3. Configure MongoDB Atlas connection
4. Enable auto-deploy from GitHub main branch

**Frontend Deployment (Netlify):**
1. Build command: `npm run build`
2. Publish directory: `build`
3. Environment variable: `REACT_APP_API_URL`

**Database (MongoDB Atlas):**
- M0 free tier for development
- M10+ with backups for production
- Whitelist backend server IPs

### Q10.2: What is your CI/CD strategy?
**Answer:** GitHub Actions workflow:
```yaml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: npm test
      - name: Run linter
        run: npm run lint
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up
```

**Benefits:**
- Automated testing on every PR
- Block merges if tests fail
- Auto-deploy on main branch merge

### Q10.3: How would you monitor this application in production?
**Answer:**

**1. Application Monitoring (PM2 + New Relic):**
```javascript
// PM2 ecosystem file
module.exports = {
  apps: [{
    name: 'foodfreaky-api',
    script: 'index.js',
    instances: 'max', // Cluster mode
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

**2. Health Checks:**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

**3. Error Tracking (Sentry):**
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());
```

**4. Database Monitoring:**
- MongoDB Atlas charts (connection count, query performance)
- Slow query analysis

---

## 11. Advanced Backend Concepts

### Q11.1: How would you implement real-time order tracking?
**Answer:** **Socket.io integration**:

**Backend:**
```javascript
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  socket.on('trackOrder', (orderId) => {
    socket.join(`order:${orderId}`);
  });
});

// In updateOrderStatus controller
io.to(`order:${orderId}`).emit('statusUpdate', { status });
```

**Frontend:**
```javascript
const socket = io('http://localhost:5000');
socket.emit('trackOrder', orderId);
socket.on('statusUpdate', ({ status }) => {
  setOrderStatus(status);
});
```

### Q11.2: How would you implement payment integration (Razorpay/Stripe)?
**Answer:**

**1. Create Order (Backend):**
```javascript
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createPaymentOrder = async (req, res) => {
  const options = {
    amount: req.body.totalPrice * 100, // Convert to paise
    currency: 'INR',
    receipt: `order_${Date.now()}`
  };
  const razorpayOrder = await razorpay.orders.create(options);
  res.json({ orderId: razorpayOrder.id });
};
```

**2. Verify Payment (Webhook):**
```javascript
const crypto = require('crypto');

exports.verifyPayment = (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
    
  if (signature === expectedSignature) {
    // Payment verified, create order
  }
};
```

### Q11.3: How would you implement a notification system?
**Answer:**

**Multi-channel approach:**

**1. Email (Existing - Nodemailer)**
**2. SMS (Twilio):**
```javascript
const twilio = require('twilio')(accountSid, authToken);

await twilio.messages.create({
  body: `Your order #${orderId} is out for delivery!`,
  from: '+1234567890',
  to: user.contactNumber
});
```

**3. Push Notifications (Firebase Cloud Messaging):**
```javascript
const admin = require('firebase-admin');

await admin.messaging().send({
  token: user.fcmToken,
  notification: {
    title: 'Order Update',
    body: 'Your food is on the way!'
  }
});
```

**4. In-app Notifications:**
Store in database, fetch via API, mark as read

---

## 12. Code Quality & Best Practices

### Q12.1: What are the code smells in the current implementation?
**Answer:**

**1. Magic Numbers:**
```javascript
// Bad
const otpExpires = Date.now() + 10 * 60 * 1000;

// Good
const OTP_EXPIRY_MINUTES = 10;
const otpExpires = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
```

**2. Hardcoded Values:**
```javascript
// Bad
if (emailDomain !== 'gmail.com' && emailDomain !== 'vitapstudent.ac.in')

// Good
const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'vitapstudent.ac.in'];
if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain))
```

**3. Mixed Concerns:**
```javascript
// createOrder controller does: validation, business logic, email sending
// Should separate into services
```

**4. Inconsistent Error Messages:**
Standardize error response format across all endpoints

### Q12.2: How would you refactor the authentication controller?
**Answer:**

**Create Service Layer:**
```javascript
// services/authService.js
class AuthService {
  async registerUser(userData) {
    // Validation, OTP generation, user creation
  }
  
  async verifyEmail(email, otp) {
    // OTP verification logic
  }
  
  async loginUser(email, password) {
    // Login logic, token generation
  }
}

// controllers/auth.js
exports.register = async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(200).json(result);
};
```

**Benefits:**
- Testability (mock service in controller tests)
- Reusability (use service in multiple controllers)
- Separation of concerns

### Q12.3: What documentation would you add?
**Answer:**

**1. API Documentation (Swagger/OpenAPI):**
```javascript
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 */
```

**2. JSDoc Comments:**
```javascript
/**
 * Creates a new food order for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} req.body - Order details
 * @param {Array} req.body.items - Array of order items
 * @param {string} req.body.shippingAddress - Delivery address
 * @returns {Promise<Object>} Created order object
 * @throws {400} If validation fails
 */
```

**3. README sections:**
- Setup instructions
- Environment variables
- API endpoint examples
- Troubleshooting guide

---

## 13. Scenario-Based Questions

### Q13.1: How would you handle a scenario where the database goes down?
**Answer:**

**1. Immediate Response:**
```javascript
// Circuit breaker pattern
const circuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = circuitBreaker(asyncDatabaseCall, options);

breaker.fallback(() => {
  return { msg: 'Service temporarily unavailable' };
});
```

**2. Graceful Degradation:**
- Serve cached data from Redis
- Queue write operations for later processing
- Show maintenance page for critical failures

**3. Monitoring & Alerts:**
- PagerDuty/Opsgenie alerts on connection failures
- Auto-restart with exponential backoff

### Q13.2: A user reports duplicate order charges. How do you debug?
**Answer:**

**1. Check Logs:**
```bash
grep "orderId: 12345" combined.log
# Look for duplicate POST /api/orders requests
```

**2. Database Investigation:**
```javascript
db.orders.find({ user: userId, createdAt: { $gte: startDate } })
  .sort({ createdAt: -1 });
// Check for duplicate orders with same items/timestamp
```

**3. Root Cause Analysis:**
- Frontend double-submission (fix: disable button on click)
- Network retry logic (fix: idempotency keys)
- Race condition (fix: database transactions)

**4. Prevention:**
```javascript
// Add idempotency
const { v4: uuidv4 } = require('uuid');

// Frontend sends idempotency key
const idempotencyKey = req.headers['idempotency-key'];
const existing = await Order.findOne({ idempotencyKey });
if (existing) {
  return res.status(200).json(existing); // Return existing order
}
```

### Q13.3: How would you implement a restaurant recommendation system?
**Answer:**

**1. Basic Algorithm (Content-Based):**
```javascript
exports.getRecommendations = async (req, res) => {
  const user = await User.findById(req.user.id);
  
  // Get user's order history
  const orders = await Order.find({ user: user._id })
    .populate('restaurant');
  
  // Extract favorite cuisines
  const cuisines = orders.map(o => o.restaurant.cuisine);
  const favoriteCuisine = getMostFrequent(cuisines);
  
  // Recommend restaurants with same cuisine
  const recommendations = await Restaurant.find({
    cuisine: favoriteCuisine,
    _id: { $nin: orders.map(o => o.restaurant._id) } // Exclude already ordered
  }).sort({ averageRating: -1 }).limit(5);
  
  res.json(recommendations);
};
```

**2. Advanced (Collaborative Filtering):**
- Find users with similar order patterns
- Recommend restaurants they ordered but current user hasn't
- Use ML libraries (TensorFlow.js) for prediction

---

## Summary: Key Takeaways for Backend Developers

### Technical Skills Demonstrated:
1. ✅ **RESTful API Design** with proper HTTP methods and status codes
2. ✅ **Database Modeling** with relationships and indexing
3. ✅ **Authentication & Authorization** using JWT and middleware
4. ✅ **Security Best Practices** (hashing, validation, CORS)
5. ✅ **Third-party Integrations** (email, PDF generation)
6. ✅ **Error Handling** with centralized middleware
7. ✅ **Code Organization** following MVC-like patterns

### Areas for Improvement:
1. ⚠️ **Input Validation** - Add Joi/express-validator
2. ⚠️ **Rate Limiting** - Prevent brute force attacks
3. ⚠️ **Logging** - Implement Winston for production
4. ⚠️ **Testing** - Add unit and integration tests
5. ⚠️ **Caching** - Implement Redis for performance
6. ⚠️ **Documentation** - Add Swagger API docs
7. ⚠️ **Monitoring** - Integrate APM tools

### Interview Readiness Tips:
- Be able to explain **WHY** you chose certain technologies (e.g., JWT over sessions)
- Discuss **trade-offs** (e.g., MongoDB vs PostgreSQL for this use case)
- Show awareness of **production concerns** (scaling, monitoring, security)
- Demonstrate **problem-solving** through real scenarios you faced
- Know your **weaknesses** and how you'd improve them

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Target Audience:** Backend Developers preparing for technical interviews
