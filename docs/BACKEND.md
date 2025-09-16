# Backend Architecture Documentation

## Overview
The FoodFreaky backend is a Node.js/Express.js REST API that handles authentication, restaurant management, order processing, and administrative functions for the food delivery platform.

## Technology Stack
- **Node.js** - JavaScript runtime environment
- **Express.js 5.1.0** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8.18.0** - MongoDB object modeling
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **bcryptjs 3.0.2** - Password hashing
- **Nodemailer 7.0.6** - Email service
- **PDFKit 0.17.2** - PDF generation
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 17.2.2** - Environment variable management

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection configuration
├── controllers/           # Route handlers and business logic
│   ├── auth.js           # Authentication logic
│   ├── restaurants.js    # Restaurant CRUD operations
│   ├── orders.js         # Order management
│   ├── admin.js          # Admin operations
│   ├── coupons.js        # Coupon management
│   └── restaurantsAdmin.js # Admin restaurant operations
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/               # MongoDB/Mongoose schemas
│   ├── User.js           # User data model
│   ├── Restaurant.js     # Restaurant data model
│   ├── Order.js          # Order data model
│   └── Coupon.js         # Coupon data model
├── routes/               # API route definitions
│   ├── auth.js           # Authentication routes
│   ├── restaurants.js    # Restaurant routes
│   ├── orders.js         # Order routes
│   ├── admin.js          # Admin routes
│   └── coupons.js        # Coupon routes
├── utils/                # Utility functions
│   ├── sendEmail.js      # Email sending functionality
│   ├── generateOTP.js    # OTP generation
│   └── generateInvoicePdf.js # PDF invoice generation
└── index.js              # Application entry point
```

## Database Models

### User Model (User.js)
```javascript
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true, select: false },
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
    role: { 
        type: String, 
        enum: ['user', 'deliveryadmin', 'admin'], 
        default: 'user' 
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: { type: Date, default: Date.now }
});
```

**Features:**
- Password hashing with bcrypt pre-save middleware
- Email validation with regex
- OTP verification system
- Password reset token generation
- Role-based access control

### Restaurant Model (Restaurant.js)
```javascript
const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    cuisine: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    tags: [String],
    imageUrl: String,
    menu: [MenuSchema]
}, { timestamps: true });

const MenuSchema = new mongoose.Schema({
    category: { type: String, required: true },
    items: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        emoji: String,
        imageUrl: String
    }]
});
```

**Features:**
- Nested menu structure with categories
- Image URL support for restaurants and menu items
- Automatic timestamps
- Search tags for cuisine filtering

### Order Model (Order.js)
```javascript
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    couponUsed: String,
    shippingAddress: { type: String, required: true },
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
    createdAt: { type: Date, default: Date.now }
});
```

**Features:**
- User reference with population
- Itemized order details
- Price breakdown (items, tax, shipping)
- Order status tracking
- Coupon integration

### Coupon Model (Coupon.js)
```javascript
const CouponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        uppercase: true 
    },
    discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        required: true 
    },
    value: { type: Number, required: true },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
```

## Authentication System

### JWT Implementation
```javascript
// Token generation
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Middleware protection
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
    }
    // ... error handling
};
```

### OTP Verification System
```javascript
// OTP generation and email sending
const otp = generateOTP(); // 6-digit random number
const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

await sendEmail({
    email: user.email,
    subject: 'FoodFreaky - Email Verification',
    html: `<h2>${otp}</h2>`
});
```

### Password Reset Flow
1. User requests password reset with email
2. Generate crypto token and save to database
3. Send reset email with token link
4. User clicks link and submits new password
5. Verify token and update password

## API Routes

### Authentication Routes (/api/auth)
- `POST /register` - User registration with OTP
- `POST /verify-otp` - Email verification
- `POST /login` - User authentication
- `POST /forgotpassword` - Password reset request
- `PUT /resetpassword/:token` - Password reset submission
- `GET /me` - Get current user (protected)

### Restaurant Routes (/api/restaurants)
- `GET /` - Get all restaurants with menus
- `GET /:id` - Get single restaurant by ID

### Order Routes (/api/orders)
- `POST /` - Create new order (protected)
- `GET /` - Get user's orders (protected)
- `GET /:id` - Get single order (protected)
- `PUT /:id` - Update order status (admin)

### Admin Routes (/api/admin)
- User management endpoints
- Restaurant CRUD operations
- Order management and analytics
- System administration

### Coupon Routes (/api/coupons)
- `GET /` - Get active coupons
- `POST /validate` - Validate coupon code
- Admin coupon management

## Middleware

### Authentication Middleware
```javascript
const protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
```

### CORS Configuration
```javascript
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'https://cheerful-cannoli-94af42.netlify.app',
            'https://foodfreaky.in',
            'https://www.foodfreaky.in'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    }
};
```

## Email Service

### Nodemailer Configuration
```javascript
const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (options) => {
    const message = {
        from: process.env.EMAIL_USERNAME,
        to: options.email,
        subject: options.subject,
        html: options.html
    };
    
    await transporter.sendMail(message);
};
```

### Email Templates
- OTP verification emails
- Password reset emails
- Order confirmation emails
- Order status updates

## PDF Generation

### Invoice Generation
```javascript
const PDFDocument = require('pdfkit');

const generateInvoicePdf = (order) => {
    const doc = new PDFDocument();
    
    // Header
    doc.fontSize(20).text('FoodFreaky Invoice', 50, 50);
    
    // Order details
    doc.fontSize(12)
       .text(`Order ID: ${order._id}`, 50, 100)
       .text(`Date: ${order.createdAt}`, 50, 120);
    
    // Items table
    let yPosition = 150;
    order.items.forEach(item => {
        doc.text(`${item.name} x${item.quantity}`, 50, yPosition)
           .text(`$${item.price * item.quantity}`, 400, yPosition);
        yPosition += 20;
    });
    
    // Total
    doc.text(`Total: $${order.totalPrice}`, 50, yPosition + 20);
    
    return doc;
};
```

## Database Configuration

### MongoDB Connection
```javascript
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};
```

### Environment Variables
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/foodfreaky
JWT_SECRET=your-secret-key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Error Handling

### Global Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};
```

## Security Features

### Password Security
- bcrypt hashing with salt rounds
- Password complexity requirements
- Secure password reset with time-limited tokens

### JWT Security
- Secret key configuration
- Token expiry (30 days)
- Token validation middleware

### Input Validation
- Mongoose schema validation
- Email format validation
- Required field validation

### CORS Protection
- Whitelist allowed origins
- Handle preflight requests
- Block unauthorized domains

## Performance Optimizations

### Database Optimization
- Proper indexing on frequently queried fields
- Mongoose lean queries for read-only operations
- Connection pooling with MongoDB

### Caching Strategies
- Consider Redis for session storage
- Cache frequently accessed restaurant data
- Implement query result caching

## Logging and Monitoring

### Console Logging
```javascript
// Server startup
console.log(`Server is running on port ${PORT}`);

// Database connection
console.log('MongoDB connected successfully');

// Error logging
console.error('Error details:', error);
```

### Recommended Enhancements
- Implement structured logging with Winston
- Add request/response logging middleware
- Set up error tracking with Sentry
- Monitor performance with APM tools

## Testing

### Recommended Testing Strategy
1. **Unit Tests**
   - Controller function testing
   - Utility function testing
   - Model validation testing

2. **Integration Tests**
   - API endpoint testing
   - Database integration testing
   - Email service testing

3. **Testing Tools**
   - Jest for test runner
   - Supertest for API testing
   - MongoDB Memory Server for database testing

## Deployment

### Production Configuration
```javascript
// Production-specific settings
if (process.env.NODE_ENV === 'production') {
    // Enable trust proxy
    app.set('trust proxy', 1);
    
    // Secure cookies
    app.use(session({
        cookie: { secure: true }
    }));
}
```

### Environment Setup
- Separate .env files for different environments
- Production database with MongoDB Atlas
- Email service configuration for production
- SSL certificate for HTTPS

## Future Enhancements

### Planned Features
1. **Real-time Features**
   - WebSocket integration for live order updates
   - Real-time notifications

2. **Advanced Analytics**
   - Order analytics and reporting
   - Restaurant performance metrics
   - User behavior tracking

3. **Enhanced Security**
   - Rate limiting with express-rate-limit
   - Input sanitization
   - API versioning

4. **Microservices Architecture**
   - Split into separate services
   - Implement API Gateway
   - Service discovery and load balancing

### Technical Improvements
- Implement comprehensive test suite
- Add API documentation with Swagger
- Set up CI/CD pipeline
- Implement database migrations
- Add request validation with Joi
- Implement caching layer with Redis