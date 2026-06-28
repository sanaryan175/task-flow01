// Feature: task-manager-app
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  const missingVar = 'VITE_API_BASE_URL';
  console.error(`Missing environment variable: ${missingVar}`);
  throw new Error(`Configuration error: "${missingVar}" is not defined.`);
}

const apiClient = axios.create({ baseURL });

// Attach JWT from localStorage before every request
apiClient.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('authUser');
    if (saved) {
      const { token } = JSON.parse(saved);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// If the server returns 401, clear the stale session so the user is redirected to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('authUser');
      // Reload so AuthContext re-reads localStorage and shows the login page
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

function cleanFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

export async function getAllTasks(filters) {
  try { return await apiClient.get('/api/tasks', { params: cleanFilters(filters) }); }
  catch (e) { throw e; }
}

export async function getTaskById(id) {
  try { return await apiClient.get(`/api/tasks/${id}`); }
  catch (e) { throw e; }
}

export async function createTask(data) {
  try { return await apiClient.post('/api/tasks', data); }
  catch (e) { throw e; }
}

export async function updateTask(id, data) {
  try { return await apiClient.put(`/api/tasks/${id}`, data); }
  catch (e) { throw e; }
}

export async function deleteTask(id) {
  try { return await apiClient.delete(`/api/tasks/${id}`); }
  catch (e) { throw e; }
}

export async function reorderTasks(orderedIds) {
  try { return await apiClient.patch('/api/tasks/reorder', { orderedIds }); }
  catch (e) { throw e; }
}
