# Task Manager — Backend

A RESTful API for managing tasks, built with Node.js, Express, and MongoDB. Supports creating, reading, updating, deleting, filtering, sorting, searching, and reordering tasks. Designed to be deployed to [Render](https://render.com) and consumed by the companion React frontend.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (via Mongoose ODM)
- **Testing:** Jest, Supertest, fast-check, mongodb-memory-server

---

## Local Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000` (or the port defined in `.env`).

---

## Environment Variables

| Variable       | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `MONGO_URI`    | MongoDB connection string (e.g. `mongodb://localhost:27017/taskmanager`)    |
| `PORT`         | Port the server listens on (defaults to `5000` if not set)                 |
| `NODE_ENV`     | Runtime environment: `development` or `production`                         |
| `FRONTEND_URL` | Allowed CORS origin for the frontend (defaults to `*` if not set)          |

---

## API Endpoints

All endpoints are mounted at `/api/tasks`.

| Method   | Path                   | Description                                                                                      |
| -------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `GET`    | `/api/tasks`           | Retrieve all tasks. Supports `status`, `priority`, `search`, and `sort` query parameters.       |
| `GET`    | `/api/tasks/:id`       | Retrieve a single task by its ID.                                                                |
| `POST`   | `/api/tasks`           | Create a new task.                                                                               |
| `PUT`    | `/api/tasks/:id`       | Update an existing task by its ID.                                                               |
| `DELETE` | `/api/tasks/:id`       | Delete a task by its ID.                                                                         |
| `PATCH`  | `/api/tasks/reorder`   | Reorder tasks by bulk-updating the `order` field. Body: `{ orderedIds: [id, ...] }`.            |

### Query Parameters for `GET /api/tasks`

| Parameter  | Values                                                            | Description                          |
| ---------- | ----------------------------------------------------------------- | ------------------------------------ |
| `status`   | `todo` \| `in-progress` \| `done`                                | Filter by task status                |
| `priority` | `low` \| `medium` \| `high`                                      | Filter by task priority              |
| `search`   | Any string (up to 200 chars)                                      | Case-insensitive title/description search |
| `sort`     | `createdAt_desc` \| `createdAt_asc` \| `dueDate_asc` \| `priority_desc` | Sort order (default: `createdAt_desc`) |

---

## Deployed URL

> **Backend API:** `https://your-backend-service.onrender.com`
