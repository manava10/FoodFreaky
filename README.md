# FoodFreaky 🍕

A full-stack food delivery application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 📖 Project Overview

FoodFreaky is a comprehensive food delivery platform that allows users to browse restaurants, place orders, and manage their food delivery experience. The platform includes user authentication, restaurant management, order tracking, and administrative features.

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 19.1.1 with React Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API for global state
- **Build Tool**: Create React App
- **Deployment**: Netlify (https://foodfreaky.in)

### Backend (Node.js/Express)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **Email Service**: Nodemailer for OTP verification and notifications
- **PDF Generation**: PDFKit for invoice generation
- **File Upload**: Support for restaurant and menu item images

## 🚀 Features

### User Features
- **Authentication**: Email/password registration with OTP verification
- **Password Recovery**: Forgot password functionality with email reset
- **Restaurant Browsing**: Browse restaurants by cuisine type and tags
- **Menu Viewing**: View restaurant menus with categories and prices
- **Shopping Cart**: Add/remove items, apply coupons
- **Order Placement**: Secure checkout with address and payment details
- **Order Tracking**: Real-time order status updates
- **User Dashboard**: View order history and account details

### Admin Features
- **Restaurant Management**: CRUD operations for restaurants and menus
- **Order Management**: View and update order statuses
- **Coupon Management**: Create and manage discount coupons
- **User Management**: View user accounts and activity
- **Role-based Access**: Different admin levels (admin, deliveryadmin)

### Additional Features
- **Email Notifications**: OTP verification, order confirmations
- **PDF Invoices**: Automated invoice generation for orders
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **CORS Configuration**: Secure cross-origin resource sharing
- **Input Validation**: Comprehensive data validation and sanitization

## 📁 Project Structure

```
FoodFreaky/
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database configuration
│   ├── controllers/        # Route handlers and business logic
│   ├── middleware/         # Authentication and validation middleware
│   ├── models/            # MongoDB/Mongoose data models
│   ├── routes/            # API route definitions
│   ├── utils/             # Utility functions (email, PDF, OTP)
│   └── index.js           # Server entry point
├── frontend/               # React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   ├── assets/        # Images and static files
│   │   └── App.js         # Main application component
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json       # Frontend dependencies
└── package.json           # Root package configuration
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  contactNumber: String,
  password: String (hashed),
  role: ['user', 'deliveryadmin', 'admin'],
  isVerified: Boolean,
  otp: String,
  otpExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

### Restaurant Model
```javascript
{
  name: String (unique),
  cuisine: String,
  deliveryTime: String,
  tags: [String],
  imageUrl: String,
  menu: [{
    category: String,
    items: [{
      name: String,
      price: Number,
      emoji: String,
      imageUrl: String
    }]
  }]
}
```

### Order Model
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    name: String,
    quantity: Number,
    price: Number
  }],
  itemsPrice: Number,
  taxPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,
  couponUsed: String,
  shippingAddress: String,
  status: ['Waiting for Acceptance', 'Accepted', 'Preparing Food', 'Out for Delivery', 'Delivered', 'Cancelled']
}
```

### Coupon Model
```javascript
{
  code: String (unique, uppercase),
  discountType: ['percentage', 'fixed'],
  value: Number,
  expiresAt: Date,
  isActive: Boolean
}
```

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration with email
- `POST /verify-otp` - Verify email with OTP
- `POST /login` - User login
- `POST /forgotpassword` - Request password reset
- `PUT /resetpassword/:resettoken` - Reset password with token
- `GET /me` - Get current user profile (protected)

### Restaurant Routes (`/api/restaurants`)
- `GET /` - Get all restaurants
- `GET /:id` - Get specific restaurant with menu

### Order Routes (`/api/orders`)
- `POST /` - Create new order (protected)
- `GET /` - Get user's orders (protected)
- `GET /:id` - Get specific order (protected)
- `PUT /:id` - Update order status (admin)

### Admin Routes (`/api/admin`)
- Restaurant management (CRUD operations)
- User management
- Order overview and management

### Coupon Routes (`/api/coupons`)
- `GET /` - Get all active coupons
- `POST /validate` - Validate coupon code
- Admin coupon management (CRUD)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- npm or yarn package manager

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   # Email configuration (for OTP and notifications)
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend application will run on `http://localhost:3000`

## 🔐 Environment Variables

### Backend Environment Variables
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `EMAIL_SERVICE` - Email service provider (e.g., gmail)
- `EMAIL_USERNAME` - Email username for sending notifications
- `EMAIL_PASSWORD` - Email password or app-specific password
- `FRONTEND_URL` - Frontend application URL for CORS configuration
- `PORT` - Server port (default: 5000)

### Frontend Environment Variables
- `REACT_APP_API_URL` - Backend API base URL

## 🚀 Deployment

### Frontend Deployment (Netlify)
The frontend is configured for Netlify deployment with:
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables configured in Netlify dashboard

### Backend Deployment
The backend can be deployed to platforms like:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

Ensure environment variables are properly configured in your deployment platform.

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```
Uses React Testing Library and Jest for component testing.

### Backend Testing
Currently, no test suite is implemented. Consider adding:
- Unit tests with Jest
- API testing with Supertest
- Database testing with MongoDB Memory Server

## 🔒 Security Features

1. **Password Hashing**: Bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Input Validation**: Mongoose schema validation
4. **CORS Configuration**: Restricted cross-origin requests
5. **Email Verification**: OTP-based email verification
6. **Password Reset**: Secure token-based password reset
7. **Role-based Access Control**: Different user roles and permissions

## 🛡️ Middleware

### Authentication Middleware
- **`protect`**: Verifies JWT token and authenticates user
- **Role-based protection**: Restricts access based on user roles

### CORS Middleware
- Configured to allow specific origins
- Supports development and production URLs

## 📱 User Interface

### Pages
- **HomePage**: Landing page with hero section
- **RestaurantPage**: Browse restaurants and menus
- **LoginPage/RegisterPage**: Authentication forms
- **DashboardPage**: User profile and order history
- **CheckoutPage**: Order placement and payment
- **AdminPages**: Restaurant and order management interfaces

### Components
- **Header**: Navigation and user menu
- **Cart**: Shopping cart with item management
- **Modal**: Reusable modal component
- **ProtectedRoute**: Route protection for authenticated users
- **AdminRoute**: Route protection for admin users

## 🎨 Styling

The application uses Tailwind CSS for styling with:
- Responsive design patterns
- Custom animations and transitions
- Consistent color scheme (orange theme)
- Mobile-first approach

## 🔧 Development Tools

### Backend
- **nodemon**: Development server with hot reload
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation
- **mongoose**: MongoDB object modeling
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **jwt-decode**: JWT token decoding
- **Tailwind CSS**: Utility-first CSS framework

## 📊 Performance Considerations

1. **Database Indexing**: Ensure proper indexing on frequently queried fields
2. **Image Optimization**: Optimize restaurant and menu item images
3. **Caching**: Implement caching strategies for frequently accessed data
4. **Pagination**: Implement pagination for large datasets
5. **Code Splitting**: Use React.lazy for code splitting in frontend

## 🐛 Known Issues

1. Security vulnerabilities in dependencies (run `npm audit fix`)
2. Consider upgrading deprecated packages
3. Add comprehensive error handling
4. Implement proper logging system
5. Add data validation on frontend forms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📚 Documentation

### For Learning & Understanding
- **[Complete Guide](docs/COMPLETE_GUIDE.md)** - 📘 **NEW! Start here to learn everything from basics to advanced** (3,275+ lines)
  - Architecture overview with diagrams
  - Request-response flow explained
  - Frontend & backend deep dives
  - Authentication & security patterns
  - Complete code walkthroughs
  - Best practices and troubleshooting

### For Reference
- [API Documentation](docs/API.md) - API endpoints and usage
- [Backend Architecture](docs/BACKEND.md) - Backend structure and patterns
- [Frontend Architecture](docs/FRONTEND.md) - Frontend structure and components
- [Database Schema](docs/DATABASE.md) - Database models and relationships

### For Implementation
- [Summary](docs/SUMMARY.md) - Quick overview of improvements
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Step-by-step guide
- [Improvements](docs/IMPROVEMENTS.md) - Detailed improvement recommendations

**New to the project?** Start with the [Complete Guide](docs/COMPLETE_GUIDE.md) to understand how everything works!

## 📄 License

This project is private and proprietary.

## 📞 Support

For restaurant partnership inquiries, contact: support@foodfreaky.in

## 🔮 Future Enhancements

1. **Real-time Notifications**: WebSocket integration for live order updates
2. **Payment Integration**: Stripe/PayPal payment processing
3. **Geolocation**: Location-based restaurant recommendations
4. **Reviews & Ratings**: User feedback system
5. **Mobile App**: React Native mobile application
6. **Analytics Dashboard**: Business intelligence and reporting
7. **Multi-language Support**: Internationalization (i18n)
8. **Dark Mode**: Theme switching functionality
