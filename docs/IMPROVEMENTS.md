# FoodFreaky Improvement Plan

This document outlines the comprehensive improvements needed for the FoodFreaky application based on analysis of the codebase, documentation, and known issues.

## 1. Security Improvements (HIGH PRIORITY)

### 1.1 Dependency Vulnerabilities
- ✅ **COMPLETED**: Updated nodemon to fix high-severity vulnerabilities in backend
- ✅ **COMPLETED**: Updated axios to latest version
- ⚠️ **PARTIAL**: Frontend react-scripts dependencies have vulnerabilities that require breaking changes
  - **Action**: Consider migrating from Create React App to Vite (see section 8.1)
  - **Alternative**: Accept current warnings as they are dev dependencies

### 1.2 Rate Limiting
- **Issue**: No rate limiting on API endpoints
- **Impact**: Vulnerable to DDoS attacks and brute force attempts
- **Action**: Add express-rate-limit middleware
```javascript
// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

module.exports = { loginLimiter, apiLimiter };
```

### 1.3 Input Sanitization
- **Issue**: No sanitization of user inputs
- **Impact**: Vulnerable to injection attacks
- **Action**: Add express-validator or Joi for validation
```javascript
// Install: npm install joi
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required()
});
```

### 1.4 Helmet for Security Headers
- **Issue**: Missing security headers
- **Action**: Add helmet middleware
```bash
npm install helmet
```
```javascript
const helmet = require('helmet');
app.use(helmet());
```

## 2. Error Handling (HIGH PRIORITY)

### 2.1 Global Error Handler
- **Issue**: Inconsistent error handling across controllers
- **Action**: Create centralized error handling middleware
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

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = { ErrorResponse, errorHandler };
```

### 2.2 Async Handler Wrapper
- **Issue**: Try-catch blocks repeated in every controller
- **Action**: Create async handler wrapper
```javascript
// backend/middleware/asyncHandler.js
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// Usage in controllers:
const asyncHandler = require('../middleware/asyncHandler');

exports.createOrder = asyncHandler(async (req, res, next) => {
  // No try-catch needed
  const order = await Order.create(req.body);
  res.status(201).json({ success: true, data: order });
});
```

### 2.3 Frontend Error Boundaries
- **Issue**: No error boundaries in React components
- **Action**: Add error boundary components
```jsx
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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 3. Logging System (HIGH PRIORITY)

### 3.1 Winston Logger
- **Issue**: Using console.log for logging
- **Action**: Implement Winston for structured logging
```bash
npm install winston
```
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
  defaultMeta: { service: 'foodfreaky-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### 3.2 Request Logging Middleware
- **Action**: Add morgan for HTTP request logging
```bash
npm install morgan
```
```javascript
const morgan = require('morgan');
const logger = require('./utils/logger');

// Custom stream to write to Winston
const stream = {
  write: (message) => logger.http(message.trim())
};

app.use(morgan('combined', { stream }));
```

## 4. Testing (HIGH PRIORITY)

### 4.1 Backend Testing Setup
- **Issue**: No backend tests exist
- **Action**: Set up Jest and Supertest
```bash
cd backend
npm install --save-dev jest supertest mongodb-memory-server @types/jest
```

```javascript
// backend/package.json
"scripts": {
  "test": "jest --coverage",
  "test:watch": "jest --watch"
},
"jest": {
  "testEnvironment": "node",
  "coverageDirectory": "coverage",
  "collectCoverageFrom": [
    "**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ]
}
```

```javascript
// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          contactNumber: '1234567890'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('msg', 'OTP sent to your email');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123',
          contactNumber: '1234567890'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
});
```

### 4.2 Frontend Testing Enhancement
- **Issue**: Minimal test coverage
- **Action**: Add comprehensive component tests
```javascript
// frontend/src/pages/__tests__/LoginPage.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';

const MockLoginPage = () => (
  <BrowserRouter>
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<MockLoginPage />);
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<MockLoginPage />);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<MockLoginPage />);
    const emailInput = screen.getByLabelText(/email address/i);
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });
});
```

## 5. Frontend Form Validation (HIGH PRIORITY)

### 5.1 Enhanced Validation
- **Issue**: Basic validation on forms
- **Action**: Strengthen validation rules
```javascript
// frontend/src/utils/validation.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!re.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain a number';
  return '';
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  if (!phone) return 'Phone number is required';
  if (!re.test(phone)) return 'Phone number must be 10 digits';
  return '';
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 3) return 'Name must be at least 3 characters';
  if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters';
  return '';
};
```

### 5.2 Form Components with Validation
```jsx
// frontend/src/components/FormInput.jsx
import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  required = false,
  ...props 
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
```

## 6. Database Optimizations (MEDIUM PRIORITY)

### 6.1 Add Indexes
- **Issue**: No database indexes for frequently queried fields
- **Action**: Add indexes to models
```javascript
// backend/models/User.js
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ otp: 1, otpExpires: 1 });

// backend/models/Restaurant.js
restaurantSchema.index({ name: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ tags: 1 });

// backend/models/Order.js
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
```

### 6.2 Pagination
- **Issue**: No pagination on large datasets
- **Action**: Implement pagination middleware
```javascript
// backend/middleware/pagination.js
const pagination = (model) => async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(req.query.filter || {});

  const results = {
    current: page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  if (endIndex < total) {
    results.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit,
    };
  }

  req.pagination = results;
  next();
};

module.exports = pagination;
```

## 7. Performance Optimizations (MEDIUM PRIORITY)

### 7.1 Redis Caching
- **Action**: Add Redis for caching
```bash
npm install redis
```
```javascript
// backend/config/redis.js
const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Connected to Redis'));

module.exports = client;
```

```javascript
// backend/middleware/cache.js
const redis = require('../config/redis');

const cache = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original send function
      const originalSend = res.json.bind(res);
      
      // Override send function
      res.json = (body) => {
        redis.setex(key, duration, JSON.stringify(body));
        return originalSend(body);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

module.exports = cache;
```

### 7.2 React Code Splitting
- **Action**: Implement lazy loading
```javascript
// frontend/src/App.js
import React, { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Suspense>
  );
}
```

## 8. Development Tools & Migration (LOW PRIORITY)

### 8.1 Migrate to Vite
- **Issue**: Create React App is deprecated and has security issues
- **Action**: Consider migrating to Vite for better performance
```bash
# Create new Vite project
npm create vite@latest frontend-new -- --template react

# Copy src and public folders
# Update imports and configurations
# Migrate environment variables from REACT_APP_ to VITE_
```

### 8.2 API Documentation with Swagger
- **Action**: Add Swagger/OpenAPI documentation
```bash
npm install swagger-jsdoc swagger-ui-express
```
```javascript
// backend/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodFreaky API',
      version: '1.0.0',
      description: 'Food delivery platform API documentation',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to API docs
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
```

### 8.3 CI/CD Pipeline
- **Action**: Add GitHub Actions workflow
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
      - name: Use Node.js
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
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npm test -- --coverage
      - name: Build
        run: cd frontend && npm run build
```

## 9. Additional Features (LOW PRIORITY)

### 9.1 WebSocket for Real-time Updates
```bash
npm install socket.io
```
```javascript
// backend/index.js
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  logger.info('New client connected');
  
  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Emit order updates
exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  
  io.to(`order-${order._id}`).emit('order-update', order);
  res.json({ success: true, data: order });
};
```

### 9.2 Dark Mode Support
```javascript
// frontend/src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ... rest of config
}
```

## 10. Environment & Configuration

### 10.1 Environment Variables Template
```bash
# backend/.env.example
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/foodfreaky

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Email
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
```

```bash
# frontend/.env.example
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Priority Summary

### Immediate (High Priority - Week 1)
1. ✅ Fix dependency vulnerabilities
2. ✅ Update engine requirements
3. Add rate limiting
4. Implement input validation (Joi)
5. Add global error handler
6. Set up Winston logging

### Short Term (High Priority - Week 2-3)
7. Add frontend error boundaries
8. Implement backend testing suite
9. Enhance frontend validation
10. Add comprehensive error handling

### Medium Term (Medium Priority - Month 1-2)
11. Add database indexes
12. Implement pagination
13. Set up Redis caching
14. Add code splitting
15. Add Swagger documentation

### Long Term (Low Priority - Month 3+)
16. Migrate to Vite
17. Add CI/CD pipeline
18. Implement WebSocket
19. Add dark mode
20. Add i18n support

## Implementation Order

Based on impact and dependencies:
1. Security (Rate limiting, Validation, Helmet)
2. Error Handling (Global handler, Async wrapper)
3. Logging (Winston, Morgan)
4. Testing (Backend tests, Enhanced frontend tests)
5. Database (Indexes, Pagination)
6. Performance (Caching, Code splitting)
7. Documentation (Swagger)
8. Advanced Features (WebSocket, Dark mode)

## Notes

- All high-priority items address known security and stability issues
- Medium-priority items improve performance and developer experience
- Low-priority items add new features and improve maintainability
- Each improvement is independent and can be implemented incrementally
- Breaking changes (like Vite migration) should be carefully planned
