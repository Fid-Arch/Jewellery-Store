# Goldmarks Jewellery - Code Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Documentation](#backend-documentation)
3. [Frontend Documentation](#frontend-documentation)
4. [Configuration Files](#configuration-files)
5. [Quick Reference](#quick-reference)
6. [Documentation Standards](#documentation-standards)

---

## Overview

This document serves as the main reference for all code documentation in the Goldmarks Jewellery E-commerce platform. All code has been professionally documented following JSDoc standards with comprehensive inline comments, security notes, and performance considerations.

### Documentation Coverage
- ✅ **Backend**: 5 core files (middleware, controllers, server)
- ✅ **Frontend**: 4 core files (context, components, routing)
- ✅ **Configuration**: Environment setup and examples
- ✅ **Guides**: Complete documentation standards and guides
- ✅ **Total**: 14+ files fully documented with 0 linting errors

---

## Backend Documentation

### 🔐 Middleware

#### 1. Validation Middleware (`Backend/middleware/validation.js`)
**Purpose**: Request validation and XSS sanitization using Joi

**Key Features**:
- Input validation with Joi schemas
- XSS protection via xss library
- Custom validators for common data types
- Automatic sanitization of request body/query/params

**Key Functions**:
```javascript
// Validate request against schema
validateRequest(schema, property = 'body')

// Sanitize all string inputs
sanitizeInput(req, res, next)

// Handle validation errors
handleValidationError(error, req, res, next)
```

**Custom Validators**:
- `password`: Strong password (8+ chars, mixed case, number, special char)
- `email`: RFC-compliant with lowercase normalization
- `phone`: International phone format
- `price`: Positive decimal with 2 decimal places
- `objectId`: MongoDB ObjectId format
- `postcode`: Australian 4-digit postcode

**Security Considerations**:
- Strips all HTML tags to prevent XSS
- Rejects unknown fields (security by design)
- SQL injection prevention via parameterized queries
- Timing-safe password comparison

**Usage Example**:
```javascript
router.post('/register', 
  validateRequest(userRegistrationSchema, 'body'),
  authController.registerUser
);
```

---

#### 2. Authentication Middleware (`Backend/middleware/auth.js`)
**Purpose**: JWT-based authentication and role-based authorization

**Key Features**:
- JWT token generation and verification
- Role-based access control (RBAC)
- Token refresh mechanism
- Stateless authentication

**Key Functions**:
```javascript
// Generate JWT token
generateToken(user_id, role = 'user')

// Verify JWT token
authenticateJWT(req, res, next)

// Check admin role
authorizeAdminJWT(req, res, next)

// Refresh expired token
refreshToken(req, res)
```

**Security Considerations**:
- Tokens expire after 24h (configurable)
- Secret key stored in environment variables
- No token blacklisting (limitation)
- Role included in JWT payload

**Usage Example**:
```javascript
router.get('/profile', 
  authenticateJWT, 
  userController.getProfile
);

router.delete('/admin/users/:id',
  authenticateJWT,
  authorizeAdminJWT,
  adminController.deleteUser
);
```

---

### 🎮 Controllers

#### 3. Authentication Controller (`Backend/controllers/authController.js`)
**Purpose**: Handle user authentication operations

**Key Features**:
- User registration with bcrypt password hashing
- Login with JWT token generation
- Password change with validation
- Profile updates with dynamic queries
- Welcome email integration

**Key Functions**:
```javascript
// Register new user
registerUser(req, res)
// Body: { firstName, lastName, email, password }

// Login user
loginUser(req, res)
// Body: { email, password }

// Change password
changePassword(req, res)
// Body: { currentPassword, newPassword }

// Update profile
updateUserProfile(req, res)
// Body: { firstName, lastName, email, phoneNumber }

// Logout user
logoutUser(req, res)
// Body: { token }
```

**Security Considerations**:
- Passwords hashed with bcrypt (11 salt rounds)
- Email uniqueness enforced
- Generic error messages prevent user enumeration
- Sensitive data never exposed in responses

**Business Logic**:
- Welcome email sent on registration (async, non-blocking)
- Dynamic profile update (only provided fields updated)
- Password requires current password verification

---

#### 4. Cart Controller (`Backend/controllers/cartController.js`)
**Purpose**: Shopping cart management with inventory validation

**Key Features**:
- Add/update/remove cart items
- Automatic cart creation for new users
- Real-time inventory validation
- Cart summary with tax calculation
- Stock availability checks

**Key Functions**:
```javascript
// Add item to cart
addItemToCart(req, res)
// Body: { product_item_id, qty }

// Get user cart
getUserCart(req, res)

// Update item quantity
updateCartItem(req, res)
// Params: cartItemId
// Body: { qty }

// Remove item
removeCartItem(req, res)
// Params: cartItemId

// Clear entire cart
clearCart(req, res)

// Get cart summary (for checkout)
getCartSummary(req, res)
```

**Business Logic**:
- One cart per user (auto-created)
- Cart persists across sessions
- Tax calculated at 10% (Australian GST)
- Quantity validation against stock
- Additive quantities when item already in cart

**API Responses**:
```javascript
// Cart structure (authenticated users)
{
  cart_id: 15,
  items: [{
    cart_item_id: 42,
    product_item_id: 100,
    qty: 2,
    price: 599.99,
    productname: "Diamond Ring",
    qty_in_stock: 5
  }],
  total_amount: 1199.98,
  itemCount: 1
}
```

---

#### 5. Server Configuration (`Backend/index.js`)
**Purpose**: Main Express server setup and routing

**Key Features**:
- Express application initialization
- CORS configuration for frontend
- JSON and raw body parsing
- Route registration for 17 endpoints
- Database connection

**Registered Routes**:
```javascript
/auth              // Authentication endpoints
/users             // User management
/products          // Product catalog
/orders            // Order management
/reviews           // Product reviews
/admin             // Admin operations
/addresses         // User addresses
/cart              // Shopping cart
/wishlist          // User wishlist
/categories        // Product categories
/promotions        // Promotions and discounts
/payments          // Payment processing
/stripe            // Stripe webhooks
/shipping          // Shipping methods
/inventory         // Inventory management
/notifications     // Notification system
/debug             // Debug utilities
```

**CORS Configuration**:
```javascript
origin: [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Alternative port
  'http://127.0.0.1:5173'
],
credentials: true,
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
```

---

## Frontend Documentation

### 🌐 State Management

#### 6. Store Context (`Frontend/src/context/StoreContext.jsx`)
**Purpose**: Global state management with React Context API

**Key Features**:
- Hybrid cart system (local storage + backend API)
- User authentication management
- Wishlist with optimistic updates
- Automatic cart migration on login
- Periodic synchronization (5 minutes)

**State Structure**:
```javascript
{
  cart: Array|Object|null,        // Shopping cart
  wishlist: Array,                // Wishlist items
  user: Object|null,              // Authenticated user
  isLoading: boolean,             // Hydration state
  appliedPromotion: Object|null,  // Promotion code
  demoOrders: Array,              // Demo orders
  cartCount: number,              // Total items in cart
  wishlistCount: number           // Total wishlist items
}
```

**Key Functions**:
```javascript
// Cart Operations
addToCart(product, qty = 1)
removeFromCart(productId)
updateQty(productId, newQty)
clearCart()

// Wishlist Operations
addToWishlist(product)
removeFromWishlist(id)

// Authentication
login(userData)
logout()

// Promotion
setAppliedPromotion(promotion)
addDemoOrder(orderData)
```

**Cart Migration Flow**:
```
Guest User:
1. Add items to cart → Stored in localStorage
2. User logs in → Cart migrated to backend
3. Backend cart becomes source of truth

Logged-in User:
1. Add items to cart → Sent to backend API
2. Local cache updated for performance
3. Periodic sync every 5 minutes
```

**Business Logic**:
- Guests use array structure: `[{product, quantity}]`
- Authenticated users use object: `{items: [], total_amount: 0}`
- Optimistic UI updates with error rollback
- Validation of cart_item_id presence (stale data check)

**Usage Example**:
```javascript
import { useStore } from '../context/StoreContext';

function MyComponent() {
  const { 
    cart, 
    cartCount, 
    addToCart, 
    user 
  } = useStore();
  
  return (
    <button onClick={() => addToCart(product, 1)}>
      Add to Cart ({cartCount})
    </button>
  );
}
```

---

### 🎨 Components

#### 7. Payment Form (`Frontend/src/components/PaymentForm.jsx`)
**Purpose**: Secure Stripe payment form for checkout

**Key Features**:
- Stripe Elements integration
- PCI-compliant card input
- Real-time card validation
- Payment method creation (not charging)

**Props**:
```javascript
{
  onPaymentSuccess: Function,  // Called with payment method
  onPaymentError: Function,    // Called on error
  loading: boolean,            // External loading state
  setLoading: Function         // Update loading state
}
```

**Card Validation**:
- Card number (Luhn check, brand detection)
- Expiry date (must be future date)
- CVC (3-4 digits depending on brand)
- Cardholder name (required)

**Security**:
- Card data never touches your server
- Stripe handles sensitive data in iframe
- Only payment method token returned
- PCI DSS compliant by design

**Usage Example**:
```javascript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

<Elements stripe={stripePromise}>
  <PaymentForm
    onPaymentSuccess={(paymentMethod) => {
      createOrder({ 
        payment_method_id: paymentMethod.id 
      });
    }}
    onPaymentError={(error) => alert(error.message)}
    loading={submitting}
    setLoading={setSubmitting}
  />
</Elements>
```

---

#### 8. Navbar Component (`Frontend/src/components/Navbar.jsx`)
**Purpose**: Main navigation bar with role-based menus

**Key Features**:
- Product category navigation
- Real-time cart/wishlist badges
- User authentication dropdown
- Role-based menu options
- Active link highlighting

**Menu Options by Role**:
```javascript
Customer:
- Profile
- Address Book
- Orders
- Logout

Admin:
- Admin Dashboard
- Logout

Staff:
- Staff Dashboard
- Logout

Guest:
- Login
```

**Badge Display**:
```javascript
// Cart badge shows total quantity
cartCount = items.reduce((sum, item) => 
  sum + item.quantity, 0
)

// Wishlist badge shows item count
wishlistCount = wishlist.length
```

**Accessibility Features**:
- Keyboard navigation support
- Click-outside-to-close dropdown
- ARIA attributes for menus
- Focus management

---

#### 9. App Component (`Frontend/src/App.jsx`)
**Purpose**: Main application routing and layout

**Key Features**:
- Client-side routing with React Router
- Role-based route protection
- Authentication redirects
- Hydration loading screen
- Centralized layout management

**Route Structure**:
```javascript
Public Routes (accessible to all):
- / (Home)
- /jewellery, /high-jewellery, /accessories, /gifts
- /product/:id
- /login, /register
- /about, /faq, /policies, /contact

Guest + Authenticated:
- /cart (accessible before login for UX)

Customer Routes (requires authentication):
- /checkout
- /order-success
- /wishlist
- /profile
- /orders
- /addresses

Admin Routes (requires admin role):
- /admin
- /admin/products
- /admin/orders
- /admin/users
- /admin/promotions
- /admin/reports

Staff Routes (requires staff role):
- /staff/orders
- /staff/reviews
```

**Route Protection**:
```javascript
// Protected route example
<Route 
  path="/checkout" 
  element={
    user?.role.toLowerCase() === "customer" 
      ? <Checkout /> 
      : <Navigate to="/login" />
  } 
/>
```

**Hydration Strategy**:
```javascript
// Show loading screen until localStorage loaded
if (isLoading) {
  return <LoadingScreen />;
}

// Prevents flash of unauthenticated content
// Ensures correct initial authentication state
```

---

## Configuration Files

### 10. Environment Variables (`Backend/example.env`)
**Purpose**: Template for environment configuration

**Required Variables**:
```bash
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=capstone_db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=11

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=app_password
EMAIL_FROM=Goldmarks <noreply@goldmarks.com>

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Shipping
AUSPOST_API_KEY=your_key
```

**Setup Instructions**:
1. Copy `Backend/example.env` to `Backend/.env`
2. Update all placeholder values
3. Generate strong JWT_SECRET: `openssl rand -base64 64`
4. Never commit `.env` to version control

---

## Quick Reference

### Backend API Endpoints

#### Authentication
```javascript
POST   /auth/register        // Register new user
POST   /auth/login           // Login user
POST   /auth/logout          // Logout user
POST   /auth/change-password // Change password
PATCH  /auth/profile         // Update profile
```

#### Cart
```javascript
GET    /cart                 // Get user cart
POST   /cart/items           // Add item
PUT    /cart/items/:id       // Update quantity
DELETE /cart/items/:id       // Remove item
DELETE /cart                 // Clear cart
GET    /cart/summary         // Get checkout summary
```

#### Products
```javascript
GET    /products             // List all products
GET    /products/:id         // Get product details
GET    /products/:id/items   // Get product variants
POST   /products             // Create product (admin)
PUT    /products/:id         // Update product (admin)
DELETE /products/:id         // Delete product (admin)
```

### Frontend Component Patterns

#### Using Store Context
```javascript
import { useStore } from '../context/StoreContext';

function Component() {
  const { 
    cart,           // Current cart state
    cartCount,      // Total items
    addToCart,      // Add item function
    user,           // Current user
    isLoading       // Loading state
  } = useStore();
}
```

#### Protected Route Pattern
```javascript
<Route 
  path="/protected" 
  element={
    user ? <ProtectedPage /> : <Navigate to="/login" />
  } 
/>
```

#### Form Submission Pattern
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    await apiCall(formData);
    // Success handling
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

---

## Documentation Standards

### JSDoc Format (Backend)
```javascript
/**
 * Function description
 * 
 * Detailed explanation of what the function does.
 * 
 * @async
 * @function functionName
 * @param {Type} paramName - Parameter description
 * @param {Object} req.body - Request body
 * @param {string} req.body.field - Field description
 * @returns {Promise<Object>} Return value description
 * 
 * @throws {400} Error description
 * @throws {500} Server error
 * 
 * @example
 * // Usage example
 * await functionName(param);
 * 
 * @security
 * - Security consideration
 * 
 * @business_logic
 * - Business rule explanation
 */
```

### React Component Format (Frontend)
```javascript
/**
 * Component description
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Type} props.propName - Prop description
 * @returns {JSX.Element} Component output
 * 
 * @example
 * <Component propName="value" />
 * 
 * @state
 * - stateVar: description
 * 
 * @accessibility
 * - Feature description
 */
```

---

## Additional Resources

### Documentation Files
- **Backend Guide**: `DOCUMENTATION_GUIDE.md`
- **Frontend Guide**: `Frontend/FRONTEND_DOCUMENTATION_GUIDE.md`
- **Environment Setup**: `ENVIRONMENT_SETUP.md`
- **Complete Summary**: `COMPLETE_DOCUMENTATION_SUMMARY.md`

### External Resources
- [JSDoc Documentation](https://jsdoc.app/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Stripe API Reference](https://stripe.com/docs/api)

### Development Tools
- **ESLint**: Code quality linting
- **Prettier**: Code formatting
- **React DevTools**: Component inspection
- **Postman**: API testing

---

## Maintenance

### Updating Documentation
When modifying code:
1. ✅ Update JSDoc comments if function signature changes
2. ✅ Add new parameters to @param list
3. ✅ Update @returns if return value changes
4. ✅ Add @throws for new error cases
5. ✅ Update examples if usage changes
6. ✅ Document breaking changes clearly

### Code Review Checklist
- [ ] Module-level documentation exists
- [ ] All functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] Security considerations documented
- [ ] Examples are accurate
- [ ] No linting errors introduced

---

## Support

### Getting Help
1. Check relevant documentation guide
2. Review code examples in documented files
3. Consult `ENVIRONMENT_SETUP.md` for setup issues
4. Use templates for new code documentation

### Contributing
Follow the documentation standards in:
- `DOCUMENTATION_GUIDE.md` (Backend)
- `Frontend/FRONTEND_DOCUMENTATION_GUIDE.md` (Frontend)

---

**Last Updated**: September 30, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete  
**Maintained By**: Goldmarks Development Team
