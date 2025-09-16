# API Documentation

## Overview
The FoodFreaky API is a RESTful service built with Express.js that provides endpoints for user authentication, restaurant management, order processing, and administrative functions.

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Responses
All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "contactNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "msg": "OTP sent to email. Please verify."
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Forgot Password
```http
POST /api/auth/forgotpassword
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```http
PUT /api/auth/resetpassword/:resettoken
```

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

### Get Current User
```http
GET /api/auth/me
```
*Requires Authentication*

## Restaurant Endpoints

### Get All Restaurants
```http
GET /api/restaurants
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "restaurant-id",
      "name": "Pizza Palace",
      "cuisine": "Italian",
      "deliveryTime": "30-45 mins",
      "tags": ["pizza", "pasta"],
      "imageUrl": "https://example.com/image.jpg",
      "menu": [
        {
          "category": "Pizza",
          "items": [
            {
              "name": "Margherita",
              "price": 12.99,
              "emoji": "🍕",
              "imageUrl": "https://example.com/pizza.jpg"
            }
          ]
        }
      ]
    }
  ]
}
```

### Get Single Restaurant
```http
GET /api/restaurants/:id
```

## Order Endpoints

### Create Order
```http
POST /api/orders
```
*Requires Authentication*

**Request Body:**
```json
{
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 12.99
    }
  ],
  "shippingAddress": "123 Main St, City, State",
  "couponUsed": "SAVE10"
}
```

### Get User Orders
```http
GET /api/orders
```
*Requires Authentication*

### Get Single Order
```http
GET /api/orders/:id
```
*Requires Authentication*

### Update Order Status
```http
PUT /api/orders/:id
```
*Requires Admin Authentication*

**Request Body:**
```json
{
  "status": "Preparing Food"
}
```

## Admin Endpoints

### Get All Users
```http
GET /api/admin/users
```
*Requires Admin Authentication*

### Get All Orders (Admin)
```http
GET /api/admin/orders
```
*Requires Admin Authentication*

### Create Restaurant
```http
POST /api/admin/restaurants
```
*Requires Admin Authentication*

### Update Restaurant
```http
PUT /api/admin/restaurants/:id
```
*Requires Admin Authentication*

### Delete Restaurant
```http
DELETE /api/admin/restaurants/:id
```
*Requires Admin Authentication*

## Coupon Endpoints

### Get All Coupons
```http
GET /api/coupons
```

### Validate Coupon
```http
POST /api/coupons/validate
```

**Request Body:**
```json
{
  "code": "SAVE10",
  "orderAmount": 50.00
}
```

**Response:**
```json
{
  "success": true,
  "discount": 5.00,
  "coupon": {
    "code": "SAVE10",
    "discountType": "percentage",
    "value": 10
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended for production use.

## CORS
The API is configured to accept requests from:
- `http://localhost:3000` (development)
- `https://cheerful-cannoli-94af42.netlify.app` (production)
- `https://foodfreaky.in`
- `https://www.foodfreaky.in`