# CampusPulse — Department-Wise Digital Notice Board

A centralized full-stack college notice board platform where **Administrators**, **Faculty**, and **Students** collaborate around department-specific announcements, circulars, and PDF attachments.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express.js, Mongoose ODM, Express Validator, Multer (PDF uploads)
- **Database**: MongoDB (with optional embedded `mongodb-memory-server` fallback for local setups without a running `mongod` service)
- **Authentication & Security**: JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, CORS, role-based access control (RBAC)

---

## Key Features by Role

### 1. Admin
- Secure JWT login & dashboard analytics (active/expired/urgent notices, department breakdown, category distribution)
- Full CRUD for Academic Departments (`name`, `code`, `headOfDepartment`, `description`, active status)
- Create, edit, pin, and delete notices across any department with optional PDF attachments
- Manage Faculty and Student accounts (create, edit department/role, activate/deactivate, delete)

### 2. Faculty
- Secure login scoped to their assigned department
- Publish notices with title, description, category, priority, publish/expiry dates, and PDF attachments (up to 5 MB)
- Edit and delete **their own** notices within their assigned department (enforced at API level)
- View previously published department notices

### 3. Student
- Self-registration with department selection + secure login
- View **department-specific** notices and Latest Announcements
- Search by keyword and filter by category, status (active/expired), and published date range
- Switch between Card View and Table View, inspect full notice details, and download attached PDFs

---

## Folder Structure

```text
Department-Digital-Notice-Board/
├── backend/
│   ├── config/          # Environment & MongoDB connection (with embedded fallback)
│   ├── controllers/     # Auth, Department, Notice, User, and Dashboard handlers
│   ├── middleware/      # JWT auth, RBAC authorize, Multer PDF upload, validation, errors
│   ├── models/          # Mongoose schemas: User, Department, Notice
│   ├── routes/          # Express REST API routes
│   ├── seed/            # Sample departments, users, notices, and PDF attachments
│   ├── tests/           # Automated Node + Supertest API integration tests
│   ├── uploads/         # Uploaded PDF attachments
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios instance with JWT interceptor
│   │   ├── components/  # Reusable UI, layout (Sidebar/Header), Notice/Dept/User modals
│   │   ├── context/     # AuthContext and ToastContext
│   │   ├── pages/       # Login, Register, Dashboard, Notices, Departments, Users, Profile
│   │   └── utils/       # Constants and date/file formatters
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** (local `mongod` or MongoDB Atlas URI).  
  *Note*: If no local MongoDB server is running on `MONGO_URI` and `ENABLE_MEMORY_DB_FALLBACK=true` is set in `backend/.env`, the backend automatically boots an embedded MongoDB instance and seeds sample data so you can run and test immediately.

### 1. Configure Environment Variables

**Backend (`backend/.env`)**
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` if using a custom MongoDB URI or JWT secret:
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/college_notice_board
JWT_SECRET=replace_with_a_strong_random_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE_MB=5
ENABLE_MEMORY_DB_FALLBACK=true
AUTO_SEED_ON_EMPTY=true
```

**Frontend (`frontend/.env`)**
```bash
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Seed Sample Data (Optional when `AUTO_SEED_ON_EMPTY=true`)

```bash
cd backend
npm run seed
```

### 4. Run the Application

Start Backend (Terminal 1):
```bash
cd backend
npm run dev
```
Backend API runs at `http://localhost:5001`.

Start Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```
Frontend Portal runs at `http://localhost:5173`.

---

## Default Seeded Accounts

| Role | Email | Password | Department |
|---|---|---|---|
| **Admin** | `admin@college.edu` | `Admin@123` | All Departments |
| **Faculty** | `faculty.cse@college.edu` | `Faculty@123` | CSE |
| **Faculty** | `faculty.ece@college.edu` | `Faculty@123` | ECE |
| **Faculty** | `faculty.me@college.edu` | `Faculty@123` | ME |
| **Student** | `student.cse@college.edu` | `Student@123` | CSE |
| **Student** | `student.ece@college.edu` | `Student@123` | ECE |

---

## Running Automated API Tests

```bash
cd backend
npm test
```

---

## REST API Overview

- `POST /api/auth/register` — Student registration
- `POST /api/auth/login` — User login (JWT)
- `GET /api/auth/me` — Current authenticated user
- `PUT /api/auth/profile` — Update own profile & password
- `GET /api/departments` — List departments (`POST/PUT/DELETE` Admin only)
- `GET /api/notices` — List notices (role-scoped, searchable, filterable)
- `GET /api/notices/latest` — Latest active announcements
- `POST /api/notices` — Publish notice with optional PDF upload (Admin/Faculty)
- `PUT /api/notices/:id` — Edit notice (Admin or owning Faculty)
- `DELETE /api/notices/:id` — Delete notice (Admin or owning Faculty)
- `GET /api/notices/:id/attachment` — Download notice PDF attachment
- `GET/POST/PUT/DELETE /api/users` — Manage Faculty & Student accounts (Admin only)
- `GET /api/dashboard/stats` — Role-scoped dashboard statistics
