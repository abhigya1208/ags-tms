# AGS Tutorial Management System

A full-stack, production-ready tuition institute management system with role-based access, fee tracking, student management, audit logging, and Excel exports.

---

## Tech Stack

- **Frontend**: React 18, Tailwind CSS (green + peach pastel), Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT + bcrypt

---

## Project Structure

```
ags-tms/
├── server/                  # Express backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── seed.js
│   └── package.json
└── client/                  # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── package.json
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

---

### 1. Clone / Extract the project

```bash
cd ags-tms
```

---

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ags-tms
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=8h
INACTIVITY_TIMEOUT=3600000
```

**Create Admin Account:**
```bash
npm run seed
```

This creates:
- Email: `admin@ags.com`
- Password: `admin123`

**Start backend:**
```bash
npm run dev       # development (with nodemon)
# or
npm start         # production
```

---

### 3. Frontend Setup

```bash
cd ../client
npm install
npm start
```

Frontend runs at: http://localhost:3000  
Backend runs at: http://localhost:5000

---

## Features

### Admin
- Full CRUD on students, teachers
- Assign classes to teachers
- View all audit logs and sessions
- Generate defaulter lists (specific month or till a month)
- Export to Excel (students, class-wise, defaulters)
- View fee amounts

### Teacher
- Login / logout (auto-logout on inactivity)
- View only assigned classes
- Add/edit students (name, phone, remarks, siblings)
- Mark fee Paid/Unpaid, enter slip number
- Archive/unarchive students
- Undo actions within active session

### System
- Auto roll number generation: `YYMM + ClassCode + Serial`
- Month-wise fee tracking per student
- Slip number auto-marks fee as Paid
- Sibling linking (bidirectional)
- Archive with "Archived from Month ⭐" label
- Search by name, roll number, phone
- Full audit trail of all changes

---

## Default Login

| Role  | Email           | Password   |
|-------|-----------------|------------|
| Admin | admin@ags.com   | admin123   |

> ⚠️ Change the admin password immediately after first login.

---

## API Endpoints

| Method | Endpoint                        | Access  |
|--------|---------------------------------|---------|
| POST   | /api/auth/login                 | Public  |
| POST   | /api/auth/logout                | Auth    |
| GET    | /api/auth/me                    | Auth    |
| GET    | /api/students                   | Auth    |
| POST   | /api/students                   | Auth    |
| GET    | /api/students/:id               | Auth    |
| PUT    | /api/students/:id               | Auth    |
| DELETE | /api/students/:id               | Admin   |
| PUT    | /api/students/:id/archive       | Auth    |
| PUT    | /api/students/:id/fee           | Auth    |
| GET    | /api/students/defaulters        | Admin   |
| POST   | /api/students/undo/:logId       | Auth    |
| GET    | /api/teachers                   | Admin   |
| POST   | /api/teachers                   | Admin   |
| PUT    | /api/teachers/:id               | Admin   |
| DELETE | /api/teachers/:id               | Admin   |
| GET    | /api/admin/dashboard            | Admin   |
| GET    | /api/admin/classes              | Auth    |
| GET    | /api/admin/sessions             | Admin   |
| GET    | /api/logs                       | Auth    |
| GET    | /api/logs/undoable              | Auth    |
| GET    | /api/logs/sessions              | Admin   |
| GET    | /api/export/students            | Admin   |
| GET    | /api/export/defaulters          | Admin   |

---

## Future-Ready Design

The codebase is structured for future expansion:

- **`branchId`** field on Users and Students (multi-branch SaaS)
- **`whatsappOptIn`** field on Students (WhatsApp alerts)
- **`amount`** field in fee records (fee amount system)
- Modular controllers/routes for easy feature addition

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Session-based inactivity auto-logout (1 hour default)
- Role-based middleware on all routes
- Rate limiting (500 req / 15 min)
- No sensitive data exposed to unauthorized roles

---

## License

Internal use — AGS Tutorial Institute
