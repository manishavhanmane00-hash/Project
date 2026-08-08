# Employee Management System

A simple full-stack CRUD app to add, view, edit, and delete employees.

**Stack:** React + Bootstrap (frontend) · Node.js + Express (backend) · MongoDB (database) · Postman (API testing)

---

## Folder Structure

```
employee-management-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   └── Employee.js            # Mongoose schema
│   ├── controllers/
│   │   └── employeeController.js  # CRUD logic
│   ├── routes/
│   │   └── employeeRoutes.js      # API routes
│   ├── .env.example               # Copy to .env
│   ├── server.js                  # App entry point
│   ├── package.json
│   └── Employee_Management_API.postman_collection.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── EmployeeList.js    # Table view (read + delete)
│   │   │   └── EmployeeForm.js    # Add/Edit form
│   │   ├── services/
│   │   │   └── employeeService.js # All axios calls in one place
│   │   ├── App.js                 # Routes
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) v18+ installed
- MongoDB running locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- [Postman](https://www.postman.com/downloads/) (optional, for testing the API directly)

---

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set your Mongo connection string:

```
MONGO_URI=mongodb://127.0.0.1:27017/employee_management
PORT=5000
```

Start the server:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

You should see:
```
MongoDB connected: 127.0.0.1
Server running on http://localhost:5000
```

---

## 3. Frontend Setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm start
```

This opens `http://localhost:3000` in your browser. The React app talks to the API at `http://localhost:5000/api/employees` (set in `src/services/employeeService.js`).

---

## 4. API Endpoints

| Method | Endpoint              | Description          |
|--------|------------------------|-----------------------|
| GET    | `/api/employees`       | Get all employees    |
| GET    | `/api/employees/:id`   | Get one employee     |
| POST   | `/api/employees`       | Create an employee   |
| PUT    | `/api/employees/:id`   | Update an employee   |
| DELETE | `/api/employees/:id`   | Delete an employee   |

**Sample POST body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@company.com",
  "phone": "555-123-4567",
  "department": "Engineering",
  "position": "Software Developer",
  "salary": 75000
}
```

---

## 5. Testing with Postman

1. Open Postman → **Import**
2. Select `backend/Employee_Management_API.postman_collection.json`
3. It includes ready-made requests for all 5 endpoints
4. After creating an employee, copy its `_id` from the response into the collection's `employeeId` variable to test Get/Update/Delete by id

---

## 6. How it Works (quick overview)

- **MongoDB** stores each employee as a document (name, email, phone, department, position, salary, dateOfJoining).
- **Express** exposes REST routes under `/api/employees`; **Mongoose** maps those documents to a schema with validation (e.g. required fields, unique email).
- **React** fetches data from the API with `axios` and renders it with **Bootstrap** components (navbar, table, cards, forms). `react-router-dom` handles navigation between the employee list, add form, and edit form without full page reloads.

## Troubleshooting

- **"Could not load employees"** in the browser → the backend isn't running, or `MONGO_URI` is wrong/MongoDB isn't running.
- **CORS errors** → make sure the backend is running on port 5000 exactly as configured in `employeeService.js`.
- **Port already in use** → change `PORT` in `backend/.env`, and update the URL in `frontend/src/services/employeeService.js` to match.
