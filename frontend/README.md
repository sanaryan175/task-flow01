# Task Manager — Frontend

A single-page task management application built with React and Vite. Lets users create, edit, delete, filter, search, sort, and drag-to-reorder tasks. Features a responsive layout, dark mode, persistent filter preferences, toast notifications, and an accessible modal form. Designed to be deployed to [Vercel](https://vercel.com) and backed by the companion Express API.

---

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Drag and Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Testing:** Vitest, React Testing Library, fast-check

---

## Local Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

---

## Environment Variables

| Variable            | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | Base URL of the backend API, no trailing slash (e.g. `http://localhost:5000`) |

---

## Deployed URL

> **Frontend App:** `https://your-frontend-app.vercel.app`
