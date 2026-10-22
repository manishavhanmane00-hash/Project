# ☕ Brew & Bite Cafe Management System

A full-stack cafe management application with a separate admin dashboard and customer ordering flow. The project includes JWT authentication, MongoDB-backed persistence, payment processing, menu management, order tracking, and role-based access control.

---

## Tech Stack

- Frontend: React 18, React Router, Axios, Bootstrap 5
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Auth: JWT + bcryptjs
- Payments: Razorpay
- Monitoring: Helmet, CORS, request rate limiting
- API workflow: Postman collection included

---

## Project Structure

```text
cafe-management-system/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── seed.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── postman/
│   └── cafe-management.postman_collection.json
├── .gitignore
├── package.json
├── README.md
└── package-lock.json
```

---

## Prerequisites

Before you start, install:

- Node.js 18+
- npm 9+
- MongoDB Server 6+ or MongoDB Atlas
- Git

---

## Local MongoDB Setup

### Option A: Local MongoDB

1. Install MongoDB locally.
2. Start the MongoDB service.
3. Use the default connection:

```env
MONGO_URI=mongodb://localhost:27017/cafe_management
```

### Option B: MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Click Connect → Drivers.
3. Copy the connection string and replace the username/password placeholders.
4. Use a string like this:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/cafe_management?retryWrites=true&w=majority
```

> Keep the database name in the URI and never commit the real values to Git.

---

## Backend Environment Setup

From the project root:

```bash
cd backend
cp .env.example .env
```

Update the file with your values:

```env
MONGO_URI=mongodb://localhost:27017/cafe_management
JWT_SECRET=replace_with_a_strong_random_secret
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

ADMIN_EMAIL=admin@cafe.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Cafe Admin
```

### Notes

- `CLIENT_URL` is used by the backend CORS configuration.
- In production, set `CLIENT_URL` to your frontend domain.
- `JWT_SECRET` must be long and random.
- If you use MongoDB Atlas, the `MONGO_URI` must include your cluster connection string.

---

## Frontend Environment Setup

```bash
cd frontend
cp .env.example .env
```

Example:

```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
```

For production deployment, set:

```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

---

## Install and Run Locally

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed the database

```bash
cd ../backend
node config/seed.js
```

This creates the default admin user and base menu data.

### 3. Start the backend

```bash
npm run dev
```

### 4. Start the frontend

Open a separate terminal:

```bash
cd frontend
npm start
```

Application URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

---

## Default Admin Credentials

```text
Email: admin@cafe.com
Password: Admin@123
```

---

## Launch Checklist

Use this before running the app in local or production mode:

- [ ] MongoDB is running and reachable
- [ ] backend/.env contains valid MONGO_URI and JWT_SECRET
- [ ] frontend/.env contains valid REACT_APP_API_URL
- [ ] backend dependencies installed
- [ ] frontend dependencies installed
- [ ] database seeded with admin user and menu data
- [ ] backend starts without errors on port 5000
- [ ] frontend starts without errors on port 3000
- [ ] login works with admin credentials
- [ ] menu loads from backend
- [ ] checkout/payment flow configured for test or live keys

---

## Production Deployment Notes

### Backend deployment

Deploy the Express app to a Node.js hosting platform such as:

- Render
- Railway
- Heroku
- DigitalOcean App Platform
- Azure App Service
- VPS with PM2

Required production environment variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.com
RAZORPAY_KEY_ID=your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
ADMIN_EMAIL=admin@cafe.com
ADMIN_PASSWORD=strong_admin_password
```

### Frontend deployment

Build the production app:

```bash
cd frontend
npm run build
```

Then deploy the generated build folder to:

- Netlify
- Vercel
- Firebase Hosting
- Nginx / static web server

Set the production environment variable:

```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### CORS note

The backend allows requests only from configured origins. Add your production frontend URL to `CLIENT_URL` and ensure the origin matches exactly.

---

## Razorpay Setup

1. Sign in to Razorpay.
2. Open the dashboard and create API keys.
3. Copy the test or live keys into the backend `.env` file.
4. Use the frontend payment flow when checking out.

For local testing, Razorpay test data is sufficient.

---

## Postman

Import the collection from:

```text
postman/cafe-management.postman_collection.json
```

Use `http://localhost:5000/api` as the base URL.

---

## Core Features

### Customer side

- Sign up and login
- Browse menu by category
- Add items to cart and adjust quantities
- Checkout with supported methods
- Track order status
- View order and payment history

### Admin side

- Dashboard overview
- Manage menu items and categories
- Review orders and payment records
- Customer list and login log monitoring
- Order status updates

---

## Useful Commands

From the project root:

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
```

From backend:

```bash
npm run dev
npm run start
```

From frontend:

```bash
npm start
npm run build
```

---

## Production Readiness Summary

This project is set up as a standard MERN application with a separate frontend and backend, secure JWT auth, MongoDB persistence, and deployment-friendly environment configuration. The remaining production deployment steps are environment-specific to your hosting provider, but the project is ready for a clean local setup and a straightforward cloud deployment flow.

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
