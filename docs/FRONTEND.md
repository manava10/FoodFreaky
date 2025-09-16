# Frontend Architecture Documentation

## Overview
The FoodFreaky frontend is a React-based single-page application (SPA) that provides an intuitive user interface for food ordering and restaurant management.

## Technology Stack
- **React 19.1.1** - Core UI library
- **React Router Dom 7.8.2** - Client-side routing
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Axios 1.11.0** - HTTP client for API requests
- **JWT-decode 4.0.0** - JWT token decoding
- **Create React App** - Build tooling and development server

## Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation header
│   ├── Cart.jsx        # Shopping cart component
│   ├── Modal.jsx       # Reusable modal component
│   └── ...
├── pages/              # Page-level components
│   ├── HomePage.jsx    # Landing page
│   ├── RestaurantPage.jsx # Restaurant listing/menu
│   ├── LoginPage.jsx   # User authentication
│   ├── DashboardPage.jsx # User dashboard
│   ├── CheckoutPage.jsx # Order checkout
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.js  # Authentication state
│   └── CartContext.js  # Shopping cart state
├── assets/            # Static assets (images, etc.)
├── App.js             # Main application component
└── index.js           # Application entry point
```

## State Management

### React Context API
The application uses React Context for global state management:

#### AuthContext
- User authentication state
- JWT token management
- User profile information
- Login/logout functionality

#### CartContext
- Shopping cart items
- Add/remove items functionality
- Cart total calculations
- Coupon application

## Routing

### Public Routes
- `/` - Home page
- `/restaurants` - Restaurant listing
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password recovery

### Protected Routes (Require Authentication)
- `/dashboard` - User dashboard and order history
- `/checkout` - Order placement

### Admin Routes (Require Admin Role)
- `/deliveryadmin` - Delivery admin panel
- `/superadmin` - Super admin panel
- `/superadmin/restaurant/:id` - Restaurant editing

## Components

### Header Component
```jsx
// Navigation with authentication state
<Header />
```
Features:
- Responsive navigation menu
- User authentication status
- Cart item count
- Logout functionality

### Cart Component
```jsx
// Global shopping cart overlay
<Cart />
```
Features:
- Add/remove items
- Quantity adjustment
- Coupon code application
- Checkout navigation

### Modal Component
```jsx
// Reusable modal for confirmations and forms
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent />
</Modal>
```

### ProtectedRoute Component
```jsx
// Route protection for authenticated users
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### AdminRoute Component
```jsx
// Role-based route protection
<AdminRoute roles={['admin', 'deliveryadmin']}>
  <AdminPage />
</AdminRoute>
```

## Pages

### HomePage
- Hero section with call-to-action
- Floating food emojis animation
- Promotional banner
- Restaurant navigation

### RestaurantPage
- Restaurant grid with search/filter
- Restaurant cards with cuisine tags
- Menu modal for each restaurant
- Add to cart functionality

### LoginPage & RegisterPage
- Form validation
- OTP verification flow
- Error handling
- Redirect after authentication

### DashboardPage
- User profile information
- Order history with status tracking
- Order details modal

### CheckoutPage
- Order summary
- Shipping address form
- Coupon application
- Order placement

### Admin Pages
- Restaurant management (CRUD operations)
- Order management and status updates
- User management
- Coupon management

## Styling

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c'
        }
      }
    }
  }
}
```

### Design System
- **Primary Color**: Orange (#f97316)
- **Typography**: System fonts with custom weights
- **Responsive**: Mobile-first approach
- **Animations**: Custom CSS animations for floating elements

## API Integration

### Axios Configuration
```javascript
// Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling
- Consistent error message display
- Token expiry handling
- Network error recovery
- Form validation errors

## Performance Optimizations

### Code Splitting
- React.lazy() for route-based code splitting
- Dynamic imports for heavy components

### Image Optimization
- Responsive images with srcSet
- Lazy loading for restaurant images
- Optimized asset delivery

### Caching
- Browser caching for static assets
- Local storage for user preferences
- Session storage for temporary data

## Security Features

### JWT Token Handling
- Secure token storage in localStorage
- Automatic token expiry handling
- Token validation on protected routes

### Input Validation
- Client-side form validation
- XSS prevention with React's built-in protections
- Sanitized user inputs

### Route Protection
- Authentication checks on protected routes
- Role-based access control
- Unauthorized access handling

## Build & Deployment

### Development
```bash
npm start       # Start development server
npm test        # Run test suite
npm run build   # Create production build
```

### Production Build
- Minified JavaScript and CSS
- Asset optimization
- Bundle analysis with source maps

### Netlify Deployment
```toml
# netlify.toml
[build]
  publish = "frontend/build"
  command = "cd frontend && npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Testing

### Testing Libraries
- **React Testing Library** - Component testing
- **Jest** - Test runner and assertions
- **@testing-library/user-event** - User interaction simulation

### Test Types
- Component unit tests
- Integration tests for user flows
- Accessibility testing

## Accessibility

### WCAG Compliance
- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Color contrast compliance

### Screen Reader Support
- Alt text for images
- Descriptive button labels
- Form field labels

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Progressive enhancement for older browsers

## Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Future Enhancements

### Planned Features
1. **Progressive Web App (PWA)**
   - Service worker implementation
   - Offline functionality
   - App-like experience

2. **Real-time Updates**
   - WebSocket integration
   - Live order tracking
   - Push notifications

3. **Enhanced UX**
   - Dark mode toggle
   - Multi-language support
   - Advanced search and filters

4. **Performance**
   - Virtual scrolling for large lists
   - Image lazy loading
   - Bundle size optimization

### Technical Debt
- Migrate from Create React App to Vite
- Implement TypeScript for better type safety
- Add comprehensive test coverage
- Implement proper error boundaries