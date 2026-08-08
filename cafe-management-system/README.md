# ☕ Brew & Bite — Cafe Management System

A full-stack, mobile-responsive web application for managing a cafe — customers can browse the menu, place orders, pay online, and track their orders in real time. Admins get a separate dashboard with full order management, payment tracking, and user activity monitoring.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Bootstrap 5, react-toastify, axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcryptjs |
| Payments | Razorpay |
| API Testing | Postman |

---

## 📁 Folder Structure

```
cafe-management-system/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── seed.js            # DB seeder (admin + menu data)
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   └── adminMiddleware.js # Admin role guard
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   └── LoginLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── adminRoutes.js
│   ├── .env                   # Environment variables (DO NOT commit)
│   ├── .env.example           # Template for .env
│   └── server.js              # Express app entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── user/
│       │   │   ├── UserNavbar.jsx
│       │   │   ├── Menu.jsx
│       │   │   ├── Cart.jsx
│       │   │   ├── OrderTracking.jsx
│       │   │   ├── OrderHistory.jsx
│       │   │   └── PaymentSlip.jsx
│       │   └── admin/
│       │       ├── AdminSidebar.jsx
│       │       ├── AdminOverview.jsx
│       │       ├── OrdersTable.jsx
│       │       ├── PaymentHistory.jsx
│       │       ├── LoginLogs.jsx
│       │       ├── CustomersList.jsx
│       │       └── MenuManager.jsx
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── CartContext.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── UserDashboard.jsx
│       │   └── AdminDashboard.jsx
│       ├── services/
│       │   └── api.js         # Axios instance with auth interceptor
│       ├── App.js
│       ├── index.js
│       └── index.css
│
└── postman/
    └── cafe-management.postman_collection.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

### 1. Clone / navigate to project

```bash
cd cafe-management-system
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:
```env
MONGO_URI=mongodb://localhost:27017/cafe_management
JWT_SECRET=your_strong_secret_here
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
ADMIN_EMAIL=admin@cafe.com
ADMIN_PASSWORD=Admin@123
```

Seed the database (creates admin user + full menu):
```bash
node config/seed.js
```

Start the backend server:
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Backend runs on: **http://localhost:5000**

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cafe.com | Admin@123 |
| User | Register on /signup | Your choice |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login (user or admin) |
| POST | `/api/auth/logout` | Private | Logout |
| GET | `/api/auth/me` | Private | Get current user |

### Menu
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/menu` | Public | All categories + sub-items |
| GET | `/api/menu/:id` | Public | Single category |
| POST | `/api/menu` | Admin | Create category |
| PUT | `/api/menu/:id` | Admin | Update category |
| DELETE | `/api/menu/:id` | Admin | Delete category |
| POST | `/api/menu/:id/subitems` | Admin | Add sub-item |
| PUT | `/api/menu/:id/subitems/:subId` | Admin | Update sub-item |
| DELETE | `/api/menu/:id/subitems/:subId` | Admin | Delete sub-item |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders/my` | User | My order history |
| GET | `/api/orders/:id` | User/Admin | Order details |
| GET | `/api/orders/:id/track` | User/Admin | Live order tracking |
| PATCH | `/api/orders/:id/status` | Admin | Update status |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/create-order` | User | Create Razorpay order |
| POST | `/api/payments/verify` | User | Verify Razorpay payment |
| POST | `/api/payments/manual` | User | Record Cash/UPI payment |
| GET | `/api/payments/receipt/:orderId` | User/Admin | Get receipt |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/dashboard` | Admin | Stats overview |
| GET | `/api/admin/orders` | Admin | All orders (filterable) |
| GET | `/api/admin/payments` | Admin | All transactions + breakdown |
| GET | `/api/admin/login-logs` | Admin | Login activity |
| GET | `/api/admin/users` | Admin | All customers |

---

## 💳 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Copy `Key ID` and `Key Secret` into backend `.env`
4. The frontend loads Razorpay checkout SDK automatically when needed

> In test mode, use Razorpay test card: `4111 1111 1111 1111`, CVV: any 3 digits, expiry: any future date

---

## 📬 Postman Testing

1. Open Postman → Import → `postman/cafe-management.postman_collection.json`
2. The collection has a `base_url` variable pre-set to `http://localhost:5000/api`
3. Run **Login (Admin)** first — token auto-saves as `admin_token`
4. Run **Login (User)** — token auto-saves as `user_token`
5. Run **Get All Menu** — `menu_id` auto-saves from first category
6. Use saved variables in subsequent requests

---

## 🔄 Order Status Flow

```
Placed → Preparing → Ready → Out for Delivery → Completed
                                    ↘
                                 Cancelled (any stage)
```

Status is updated by admin; user's tracking page polls every 15 seconds for live updates.

---

## 🏗 Features Summary

### Customer Side
- ✅ Signup / Login with JWT auth
- ✅ Browse menu by category (card grid)
- ✅ Expandable sub-items with images, descriptions, prices
- ✅ Cart with quantity controls (persisted in localStorage)
- ✅ Checkout with 6 payment methods
- ✅ Razorpay integration (UPI, Card, Net Banking)
- ✅ Cash/UPI/GPay/PhonePe manual payment recording
- ✅ Live order tracking with progress timeline (polls every 15s)
- ✅ Toast notifications for order placed / completed
- ✅ Order history
- ✅ Printable payment receipt/slip

### Admin Side
- ✅ Separate layout with sidebar navigation
- ✅ Dashboard stats (today's orders, revenue, active users, pending)
- ✅ All orders table with status filter, date filter, pagination
- ✅ One-click status progression for orders
- ✅ Payment history with method breakdown chart
- ✅ Customer list with order count and total spend
- ✅ Login activity log with active/inactive status
- ✅ Menu CRUD (add/delete categories and sub-items)
