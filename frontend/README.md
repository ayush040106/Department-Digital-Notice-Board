# CampusPulse — Department-Wise Digital Notice Board (React UI)

A modern, responsive React + Vite + Tailwind CSS frontend for a centralized college **Department-Wise Digital Notice Board**, powered by realistic mock data and browser `localStorage` persistence for standalone evaluation and GitHub deployment.

---

## Features by Role

### Admin
- Secure portal login and college-wide dashboard statistics
- Add, edit, and delete academic departments (`CSE`, `ECE`, `ME`, `CE`, `MBA`, etc.)
- Publish, edit, pin, and delete notices across any department
- Manage Faculty and Student accounts (create, edit role/department, activate/deactivate, delete)
- View department-wise notice breakdown and category distributions

### Faculty
- Login scoped to their assigned department
- Publish notices with title, description, category, priority, publish/expiry dates, and `.pdf` attachments
- Edit and delete their own notices in their assigned department
- Filter between all department notices and their own published posts

### Student
- Register with department selection and log in securely
- View department-specific notices and Latest Announcements
- Search by keyword and filter by category, status (`Active` / `Expired`), and published date range
- Switch between **Card View** and **Table View**
- Inspect full notice details and download PDF attachments directly in the browser

---

## Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS** (clean white surface with Navy Blue & Indigo accents)
- **React Router v6** (role-protected routes)
- **Lucide React** (consistent iconography)
- **Mock API & Persistence Engine** (`src/data/mockData.js` + `src/api/mockApi.js` backed by `localStorage`)

---

## Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**

### Installation & Local Development

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## Demo Accounts (Pre-seeded Mock Data)

You can type these credentials or click the quick-fill buttons on the Login page:

| Role | Email | Password | Department |
|---|---|---|---|
| **Admin** | `admin@college.edu` | `Admin@123` | All Departments |
| **Faculty** | `faculty.cse@college.edu` | `Faculty@123` | CSE |
| **Faculty** | `faculty.ece@college.edu` | `Faculty@123` | ECE |
| **Student** | `student.cse@college.edu` | `Student@123` | CSE |
| **Student** | `student.ece@college.edu` | `Student@123` | ECE |

> All changes (new registrations, departments, notices, user edits) persist in `localStorage`. You can restore the default sample dataset anytime from **My Profile → Reset Demo Data**.

---

## Folder Structure

```text
frontend/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── api/
    │   ├── axios.js          # API client adapter (defaults to standalone mock mode)
    │   └── mockApi.js        # In-browser mock REST handlers + localStorage persistence
    ├── data/
    │   └── mockData.js       # Sample departments, users, notices, and PDF generator
    ├── context/
    │   ├── AuthContext.jsx   # Authentication & session state
    │   └── ToastContext.jsx  # Success/error toast notifications
    ├── components/
    │   ├── common/           # Badge, Modal, ConfirmModal, StatCard, EmptyState, ToastContainer
    │   ├── layout/           # Responsive Sidebar, Header, DashboardLayout
    │   ├── notices/          # NoticeCard, NoticeDetailModal, NoticeFormModal
    │   ├── departments/      # DepartmentFormModal
    │   └── users/            # UserFormModal
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── RegisterPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── NoticesPage.jsx
    │   ├── DepartmentsPage.jsx
    │   ├── UsersPage.jsx
    │   └── ProfilePage.jsx
    └── utils/
        ├── constants.js
        └── formatters.js
```
