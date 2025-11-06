# 🧪 Toast Notifications - Testing Checklist

This document lists all functions and locations where toast notifications have been implemented.

---

## 📋 Complete List of Toast Implementations

### 1. **CheckoutPage.jsx** (`/checkout`)

#### Function: `handlePlaceOrder()`
**Location**: Line ~115-150

**Toasts Implemented**:
- ❌ **Error Toast**: "Please fill in your address and contact number."
  - **Trigger**: When user tries to place order without address/contact
  - **Test**: Click "Place Order" without filling address
  
- ❌ **Error Toast**: "Failed to place order. Please try again."
  - **Trigger**: When API call fails during order placement
  - **Test**: Simulate network error or invalid order data

**How to Test**:
1. Go to `/checkout`
2. Try placing order without address → Should see error toast
3. Fill address, place order (with network issues) → Should see error toast

---

### 2. **DashboardPage.jsx** (`/dashboard`)

#### Function: `handleRatingSubmit()`
**Location**: Line ~59-88

**Toasts Implemented**:
- ⚠️ **Warning Toast**: "Please select a rating."
  - **Trigger**: When user tries to submit rating without selecting a star
  - **Test**: Click "Rate Order" button without selecting rating
  
- ❌ **Error Toast**: "Failed to submit rating." (or error message from API)
  - **Trigger**: When rating API call fails
  - **Test**: Submit rating with network error

#### Function: `handleCancelOrder()`
**Location**: Line ~90-109

**Toasts Implemented**:
- ❌ **Error Toast**: "Failed to cancel order. It may no longer be cancellable."
  - **Trigger**: When cancel order API fails
  - **Test**: Try canceling an order that can't be cancelled

#### Function: `handleDownloadInvoice()`
**Location**: Line ~111-140

**Toasts Implemented**:
- ❌ **Error Toast**: "Could not download the invoice. Please try again later."
  - **Trigger**: When invoice download fails
  - **Test**: Try downloading invoice with network error

**How to Test**:
1. Go to `/dashboard`
2. Find a delivered order
3. Click "Rate Order" without selecting rating → Warning toast
4. Try submitting rating with error → Error toast
5. Try canceling order (if possible) → Error toast if fails
6. Try downloading invoice → Error toast if fails

---

### 3. **RestaurantPage.jsx** (`/restaurants`)

#### Function: `handleAddToCart()`
**Location**: Line ~148-160

**Toasts Implemented**:
- ✅ **Success Toast**: "[Item Name] added to cart!"
  - **Trigger**: When adding a new item to cart
  - **Test**: Add an item that's not already in cart
  
- ✅ **Success Toast**: "[Item Name] quantity updated!"
  - **Trigger**: When increasing quantity of existing item
  - **Test**: Add an item that's already in cart

**How to Test**:
1. Go to `/restaurants`
2. Select a restaurant
3. Add a new item → Should see "added to cart!" toast
4. Add same item again → Should see "quantity updated!" toast

---

### 4. **OrderManager.jsx** (Admin Component)

#### Function: `handleUpdateOrder()`
**Location**: Line ~16-38

**Toasts Implemented**:
- ✅ **Success Toast**: "Order status updated successfully!"
  - **Trigger**: When order status is successfully updated
  - **Test**: Change order status and click "Update Status"
  
- ❌ **Error Toast**: "Failed to update order status."
  - **Trigger**: When order status update API fails
  - **Test**: Try updating status with network error

**How to Test**:
1. Go to `/superadmin` or `/deliveryadmin`
2. Find an order
3. Change status dropdown
4. Click "Update Status" → Success toast
5. Simulate error → Error toast

---

### 5. **CouponManager.jsx** (Admin Component)

#### Function: `handleCreateCoupon()`
**Location**: Line ~34-66

**Toasts Implemented**:
- ✅ **Success Toast**: "Coupon created successfully!"
  - **Trigger**: When coupon is successfully created
  - **Test**: Fill coupon form and submit
  
- ❌ **Error Toast**: Error message from API or "Failed to create coupon"
  - **Trigger**: When coupon creation fails
  - **Test**: Try creating duplicate coupon code

#### Function: `handleDeleteCoupon()`
**Location**: Line ~68-76

**Toasts Implemented**:
- ✅ **Success Toast**: "Coupon deleted successfully!"
  - **Trigger**: When coupon is successfully deleted
  - **Test**: Click delete (×) button on a coupon
  
- ❌ **Error Toast**: "Failed to delete coupon."
  - **Trigger**: When coupon deletion fails
  - **Test**: Try deleting with network error

**How to Test**:
1. Go to `/superadmin`
2. Create a new coupon → Success toast
3. Try creating duplicate coupon → Error toast
4. Delete a coupon → Success toast
5. Simulate error → Error toast

---

### 6. **RestaurantManager.jsx** (Admin Component)

#### Function: `handleDeleteRestaurant()`
**Location**: Line ~58-69

**Toasts Implemented**:
- ✅ **Success Toast**: "Restaurant deleted successfully!"
  - **Trigger**: When restaurant is successfully deleted
  - **Test**: Click delete on a restaurant
  
- ❌ **Error Toast**: "Failed to delete restaurant."
  - **Trigger**: When restaurant deletion fails
  - **Test**: Try deleting with network error

**How to Test**:
1. Go to `/superadmin`
2. Find a restaurant
3. Click delete → Success toast
4. Simulate error → Error toast

---

### 7. **DeliveryAdminPage.jsx** (`/deliveryadmin`)

#### Function: `handleUpdateOrder()`
**Location**: Line ~41-63

**Toasts Implemented**:
- ✅ **Success Toast**: "Order status updated successfully!"
  - **Trigger**: When order status is successfully updated
  - **Test**: Change order status and click "Update Status"
  
- ❌ **Error Toast**: "Failed to update order status."
  - **Trigger**: When order status update fails
  - **Test**: Try updating with network error

**How to Test**:
1. Go to `/deliveryadmin`
2. Find an order
3. Change status and update → Success toast
4. Simulate error → Error toast

---

### 8. **EditRestaurantPage.jsx** (`/superadmin/restaurant/:id`)

#### Function: `handleSaveRestaurant()`
**Location**: Line ~90-104

**Toasts Implemented**:
- ✅ **Success Toast**: "Restaurant updated successfully!"
  - **Trigger**: When restaurant details are successfully saved
  - **Test**: Edit restaurant info and click save
  
- ❌ **Error Toast**: Error message from API or "Failed to update restaurant."
  - **Trigger**: When restaurant update fails
  - **Test**: Try updating with invalid data

**How to Test**:
1. Go to `/superadmin`
2. Click edit on a restaurant
3. Make changes and save → Success toast
4. Try invalid data → Error toast

---

### 9. **LoginPage.jsx** (`/login`)

#### Function: `handleGoogleLogin()`
**Location**: Line ~87-89

**Toasts Implemented**:
- ℹ️ **Info Toast**: "Google Login coming soon! 🚀"
  - **Trigger**: When user clicks "Sign in with Google" button
  - **Test**: Click the Google login button

**How to Test**:
1. Go to `/login`
2. Click "Sign in with Google" button → Info toast

---

### 10. **App.js** (Global)

#### Function: Inactivity Logout Handler
**Location**: Line ~20-30

**Toasts Implemented**:
- ⚠️ **Warning Toast**: "You have been logged out due to inactivity."
  - **Trigger**: When user is inactive for 5 minutes
  - **Test**: Login, then don't interact with app for 5+ minutes

**How to Test**:
1. Login to the app
2. Don't move mouse, type, or click for 5 minutes
3. Should see warning toast when logged out

---

## 🎯 Quick Test Scenarios

### Scenario 1: Cart Operations
1. Go to `/restaurants`
2. Add item → ✅ Success: "Item added to cart!"
3. Add same item again → ✅ Success: "Item quantity updated!"

### Scenario 2: Order Placement
1. Go to `/checkout`
2. Click "Place Order" without address → ❌ Error: "Please fill in your address..."
3. Fill address, place order → Success modal (if successful)

### Scenario 3: Admin Order Management
1. Go to `/superadmin` or `/deliveryadmin`
2. Change order status → ✅ Success: "Order status updated successfully!"

### Scenario 4: Coupon Management
1. Go to `/superadmin`
2. Create coupon → ✅ Success: "Coupon created successfully!"
3. Delete coupon → ✅ Success: "Coupon deleted successfully!"

### Scenario 5: Rating System
1. Go to `/dashboard`
2. Click "Rate Order" without selecting → ⚠️ Warning: "Please select a rating."
3. Select rating and submit → Success modal

---

## 📍 Toast Appearance Locations

All toasts appear in the **top-right corner** of the screen with:
- **Position**: Fixed, top-right (20px from top, 20px from right)
- **Animation**: Slides in from right, slides out to right
- **Duration**: 4 seconds (auto-dismiss)
- **Stacking**: Multiple toasts stack vertically with 12px gap

---

## 🔍 Code Locations Reference

| File | Function | Toast Type | Line Number |
|------|----------|------------|-------------|
| CheckoutPage.jsx | handlePlaceOrder | Error | ~117, ~150 |
| DashboardPage.jsx | handleRatingSubmit | Warning, Error | ~61, ~86 |
| DashboardPage.jsx | handleCancelOrder | Error | ~107 |
| DashboardPage.jsx | handleDownloadInvoice | Error | ~138 |
| RestaurantPage.jsx | handleAddToCart | Success | ~156, ~158 |
| OrderManager.jsx | handleUpdateOrder | Success, Error | ~33, ~36 |
| CouponManager.jsx | handleCreateCoupon | Success, Error | ~60, ~64 |
| CouponManager.jsx | handleDeleteCoupon | Success, Error | ~71, ~73 |
| RestaurantManager.jsx | handleDeleteRestaurant | Success, Error | ~64, ~66 |
| DeliveryAdminPage.jsx | handleUpdateOrder | Success, Error | ~58, ~61 |
| EditRestaurantPage.jsx | handleSaveRestaurant | Success, Error | ~97, ~102 |
| LoginPage.jsx | handleGoogleLogin | Info | ~88 |
| App.js | Inactivity handler | Warning | ~28 |

---

## ✅ Testing Checklist

### Success Toasts (Green)
- [ ] Item added to cart
- [ ] Item quantity updated
- [ ] Order status updated
- [ ] Coupon created
- [ ] Coupon deleted
- [ ] Restaurant deleted
- [ ] Restaurant updated

### Error Toasts (Red)
- [ ] Missing address/contact on checkout
- [ ] Order placement failed
- [ ] Rating submission failed
- [ ] Order cancellation failed
- [ ] Invoice download failed
- [ ] Order status update failed
- [ ] Coupon creation failed
- [ ] Coupon deletion failed
- [ ] Restaurant deletion failed
- [ ] Restaurant update failed

### Warning Toasts (Orange)
- [ ] Rating not selected
- [ ] Inactivity logout

### Info Toasts (Blue)
- [ ] Google login coming soon

---

## 🎨 Visual Verification

When testing, verify:
- ✅ Toast appears in top-right corner
- ✅ Correct color (green/red/orange/blue)
- ✅ Correct icon (✅/❌/⚠️/ℹ️)
- ✅ Message is clear and readable
- ✅ Auto-dismisses after 4 seconds
- ✅ Can close manually with X button
- ✅ Multiple toasts stack correctly
- ✅ Animations are smooth
- ✅ Works on mobile (responsive)

---

## 🐛 Common Issues to Check

1. **Toast not appearing**: Check if ToastProvider is in index.js
2. **Wrong position**: Check Toast.css positioning
3. **No animation**: Check if CSS is imported
4. **Multiple toasts not stacking**: Check ToastContext logic
5. **Toast doesn't dismiss**: Check duration and timer logic

---

**Total Toast Locations**: 13 functions across 10 files
**Total Toast Calls**: ~20+ toast notifications implemented

