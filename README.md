# TaskFlow — Full-Stack Task Manager

A full-stack task management application with JWT authentication, built with Node.js/Express/MongoDB on the backend and React/Vite/Tailwind CSS on the frontend.

![TaskFlow](https://img.shields.io/badge/Stack-MERN-6366f1?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)

---

## Features

- 🔐 **Authentication** — JWT-based sign up, sign in, and sign out
- ✅ **Task CRUD** — Create, read, update, and delete tasks
- 🎯 **Priority & Status** — Low / Medium / High priority; Todo / In Progress / Done status
- 🔍 **Search & Filter** — Search by keyword, filter by status/priority, sort by date or priority
- 🖱️ **Drag to Reorder** — Drag-and-drop task ordering with optimistic UI
- 🌙 **Dark Mode** — Persisted theme preference via localStorage
- 🔔 **Toast Notifications** — Success and error feedback
- 📱 **Responsive** — Mobile-first layout, 1–3 column grid

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Testing | Jest, Supertest, Vitest, React Testing Library, fast-check |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
task-manager-app/
├── backend/                 # Express REST API
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth (protect), error handler, ObjectId validator
│   ├── models/              # Mongoose schemas (Task, User)
│   ├── routes/              # Express routers (tasks, auth)
│   ├── .env.example         # Environment variable template
│   └── server.js            # App entry point
│
└── frontend/                # React SPA
    └── src/
        ├── api/             # Axios instance + API functions
        ├── components/      # TaskCard, TaskForm, FilterBar, Modal, Toast
        ├── context/         # AuthContext, ToastContext
        ├── hooks/           # useTasks custom hook
        └── pages/           # Home, Login, Signup
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- A MongoDB Atlas account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/task-manager-app.git
cd task-manager-app
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskmanager
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

Start the server:

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Port the server listens on (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin (your frontend URL) |
| `JWT_SECRET` | Secret key used to sign JWTs |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API (no trailing slash) |

---

## API Endpoints

Base path: `/api`

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in and receive a JWT |
| `GET` | `/api/auth/me` | Get current user (requires token) |

### Tasks (all require Authorization header)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all tasks (supports filters) |
| `GET` | `/api/tasks/:id` | Get a single task |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PATCH` | `/api/tasks/reorder` | Bulk-update task order |

#### Query params for `GET /api/tasks`

| Param | Values |
|---|---|
| `status` | `todo` \| `in-progress` \| `done` |
| `priority` | `low` \| `medium` \| `high` |
| `search` | Any string (case-insensitive) |
| `sort` | `createdAt_desc` \| `createdAt_asc` \| `dueDate_asc` \| `priority_desc` |

---

## Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## Deployment

| Service | Platform |
|---|---|
| Backend | [Render](https://render.com) — set all env vars in the dashboard |
| Frontend | [Vercel](https://vercel.com) — set `VITE_API_BASE_URL` in project settings |

