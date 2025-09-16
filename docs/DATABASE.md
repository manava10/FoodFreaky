# Database Schema Documentation

## Overview
FoodFreaky uses MongoDB as its primary database with Mongoose as the Object Document Mapper (ODM). The database is designed to support a food delivery platform with users, restaurants, orders, and coupons.

## Database Design Principles
- **Normalization**: Appropriate use of references vs. embedded documents
- **Indexing**: Strategic indexing for performance optimization
- **Validation**: Schema-level validation for data integrity
- **Scalability**: Design supports horizontal scaling

## Collections

### Users Collection

#### Schema Definition
```javascript
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    contactNumber: {
        type: String,
        required: [true, 'Please add a contact number'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false, // Exclude from queries by default
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'deliveryadmin', 'admin'],
        default: 'user',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
```

#### Sample Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "contactNumber": "+1234567890",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMye.IjmCGvw3BJjr6.a4VJwV7ePi/QM9XC",
  "isVerified": true,
  "role": "user",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Indexes
```javascript
// Unique index on email
UserSchema.index({ email: 1 }, { unique: true });

// Index on role for admin queries
UserSchema.index({ role: 1 });

// Compound index for OTP verification
UserSchema.index({ email: 1, otp: 1 });
```

#### Methods
```javascript
// Password comparison
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    return resetToken;
};
```

### Restaurants Collection

#### Schema Definition
```javascript
const MenuSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    items: [{
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        emoji: String,
        imageUrl: String,
    }],
});

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
    },
    cuisine: {
        type: String,
        required: [true, 'Please add a cuisine type'],
    },
    deliveryTime: {
        type: String,
        required: true,
    },
    tags: [String],
    imageUrl: {
        type: String,
    },
    menu: [MenuSchema],
}, {
    timestamps: true,
});
```

#### Sample Document
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Pizza Palace",
  "cuisine": "Italian",
  "deliveryTime": "30-45 mins",
  "tags": ["pizza", "pasta", "italian"],
  "imageUrl": "https://example.com/pizza-palace.jpg",
  "menu": [
    {
      "category": "Pizza",
      "items": [
        {
          "name": "Margherita",
          "price": 12.99,
          "emoji": "🍕",
          "imageUrl": "https://example.com/margherita.jpg"
        },
        {
          "name": "Pepperoni",
          "price": 14.99,
          "emoji": "🍕",
          "imageUrl": "https://example.com/pepperoni.jpg"
        }
      ]
    },
    {
      "category": "Pasta",
      "items": [
        {
          "name": "Spaghetti Carbonara",
          "price": 13.99,
          "emoji": "🍝",
          "imageUrl": "https://example.com/carbonara.jpg"
        }
      ]
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Indexes
```javascript
// Unique index on restaurant name
RestaurantSchema.index({ name: 1 }, { unique: true });

// Text index for search functionality
RestaurantSchema.index({ 
    name: "text", 
    cuisine: "text", 
    tags: "text" 
});

// Index on cuisine for filtering
RestaurantSchema.index({ cuisine: 1 });

// Index on tags for tag-based searches
RestaurantSchema.index({ tags: 1 });
```

### Orders Collection

#### Schema Definition
```javascript
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    couponUsed: {
        type: String,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: [
            'Waiting for Acceptance', 
            'Accepted', 
            'Preparing Food', 
            'Out for Delivery', 
            'Delivered', 
            'Cancelled'
        ],
        default: 'Waiting for Acceptance',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
```

#### Sample Document
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "user": "507f1f77bcf86cd799439011",
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 12.99
    },
    {
      "name": "Coca Cola",
      "quantity": 1,
      "price": 2.99
    }
  ],
  "itemsPrice": 28.97,
  "taxPrice": 2.32,
  "shippingPrice": 4.99,
  "totalPrice": 36.28,
  "couponUsed": "SAVE10",
  "shippingAddress": "123 Main St, Cityville, State 12345",
  "status": "Delivered",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

#### Indexes
```javascript
// Index on user for user's order history
orderSchema.index({ user: 1 });

// Index on status for admin order management
orderSchema.index({ status: 1 });

// Compound index for user orders by date
orderSchema.index({ user: 1, createdAt: -1 });

// Index on createdAt for time-based queries
orderSchema.index({ createdAt: -1 });
```

### Coupons Collection

#### Schema Definition
```javascript
const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    value: {
        type: Number,
        required: [true, 'Please add a discount value']
    },
    expiresAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
```

#### Sample Document
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "code": "SAVE10",
  "discountType": "percentage",
  "value": 10,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Indexes
```javascript
// Unique index on coupon code
CouponSchema.index({ code: 1 }, { unique: true });

// Index on active status for active coupon queries
CouponSchema.index({ isActive: 1 });

// Compound index for active coupons that haven't expired
CouponSchema.index({ isActive: 1, expiresAt: 1 });
```

## Relationships

### User-Order Relationship
- **Type**: One-to-Many (One user can have multiple orders)
- **Implementation**: Reference (ObjectId) in Order document
- **Population**: Orders can be populated with user details

```javascript
// Populate user in order query
const order = await Order.findById(orderId).populate('user', 'name email');
```

### Restaurant-Menu Relationship
- **Type**: One-to-Many (One restaurant has multiple menu items)
- **Implementation**: Embedded documents (menu array in restaurant)
- **Rationale**: Menu items are tightly coupled with restaurants

### Order-Items Relationship
- **Type**: One-to-Many (One order contains multiple items)
- **Implementation**: Embedded documents (items array in order)
- **Rationale**: Order items are specific to each order

## Data Validation

### Email Validation
```javascript
email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
    ],
}
```

### Password Requirements
```javascript
password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
}
```

### Enum Validation
```javascript
role: {
    type: String,
    enum: ['user', 'deliveryadmin', 'admin'],
    default: 'user',
}

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
    default: 'Waiting for Acceptance',
}
```

## Database Queries

### Common User Queries
```javascript
// Find user by email
const user = await User.findOne({ email: 'user@example.com' });

// Find all admin users
const admins = await User.find({ role: { $in: ['admin', 'deliveryadmin'] } });

// Find unverified users
const unverified = await User.find({ isVerified: false });
```

### Common Restaurant Queries
```javascript
// Find restaurants by cuisine
const italianRestaurants = await Restaurant.find({ cuisine: 'Italian' });

// Text search across restaurants
const searchResults = await Restaurant.find({ 
    $text: { $search: 'pizza pasta' } 
});

// Find restaurants with specific tags
const pizzaPlaces = await Restaurant.find({ tags: 'pizza' });
```

### Common Order Queries
```javascript
// Get user's order history
const userOrders = await Order.find({ user: userId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

// Get orders by status
const pendingOrders = await Order.find({ 
    status: 'Waiting for Acceptance' 
});

// Get orders within date range
const todayOrders = await Order.find({
    createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
});
```

### Common Coupon Queries
```javascript
// Find active coupons
const activeCoupons = await Coupon.find({ 
    isActive: true,
    expiresAt: { $gt: new Date() }
});

// Validate specific coupon
const coupon = await Coupon.findOne({ 
    code: 'SAVE10',
    isActive: true,
    $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
    ]
});
```

## Aggregation Pipelines

### Order Analytics
```javascript
// Total revenue by date
const revenueByDate = await Order.aggregate([
    {
        $match: { status: 'Delivered' }
    },
    {
        $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            },
            totalRevenue: { $sum: '$totalPrice' },
            orderCount: { $sum: 1 }
        }
    },
    {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
    }
]);

// Popular menu items
const popularItems = await Order.aggregate([
    { $unwind: '$items' },
    {
        $group: {
            _id: '$items.name',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
]);
```

### User Analytics
```javascript
// User registration trends
const registrationTrends = await User.aggregate([
    {
        $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
        }
    },
    {
        $sort: { '_id.year': -1, '_id.month': -1 }
    }
]);
```

## Performance Optimization

### Indexing Strategy
1. **Primary Indexes**: Unique indexes on frequently queried fields
2. **Secondary Indexes**: Non-unique indexes for common queries
3. **Compound Indexes**: Multi-field indexes for complex queries
4. **Text Indexes**: Full-text search capabilities

### Query Optimization
```javascript
// Use lean() for read-only operations
const restaurants = await Restaurant.find().lean();

// Select only required fields
const users = await User.find({}, 'name email role');

// Use pagination for large datasets
const orders = await Order.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
```

### Connection Optimization
```javascript
// Connection pooling configuration
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0 // Disable mongoose buffering
});
```

## Data Migration

### Sample Migration Script
```javascript
// Migration to add new field to existing documents
const addRoleToExistingUsers = async () => {
    await User.updateMany(
        { role: { $exists: false } },
        { $set: { role: 'user' } }
    );
};

// Migration to ensure all restaurants have timestamps
const addTimestampsToRestaurants = async () => {
    const now = new Date();
    await Restaurant.updateMany(
        { 
            $or: [
                { createdAt: { $exists: false } },
                { updatedAt: { $exists: false } }
            ]
        },
        { 
            $set: { 
                createdAt: now,
                updatedAt: now
            } 
        }
    );
};
```

## Backup and Recovery

### Backup Strategy
```bash
# Create database backup
mongodump --uri="mongodb://localhost:27017/foodfreaky" --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/foodfreaky" /backup/20240115
```

### Data Retention Policy
- Keep order data for 7 years (legal requirement)
- Archive old user data after 3 years of inactivity
- Regular cleanup of expired OTPs and reset tokens

## Security Considerations

### Data Protection
- Password hashing with bcrypt
- JWT token expiry management
- Input validation and sanitization
- Indexed queries to prevent full collection scans

### Access Control
- Role-based access control through user roles
- Protected routes with authentication middleware
- Admin-only operations validation

### Data Privacy
- Personal data encryption in transit and at rest
- GDPR compliance for user data
- Regular security audits

## Monitoring and Analytics

### Key Metrics to Monitor
- Database connection pool usage
- Query performance and slow queries
- Index usage statistics
- Collection growth rates
- Error rates and patterns

### Recommended Tools
- MongoDB Compass for visual query analysis
- MongoDB Atlas monitoring (if using cloud)
- Custom logging for application-specific metrics