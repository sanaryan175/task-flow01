// Feature: task-manager-app
import axios from 'axios';

// Requirement 9.1 — throw at init time if VITE_API_BASE_URL is absent or empty
const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  const missingVar = 'VITE_API_BASE_URL';
  console.error(`Missing environment variable: ${missingVar}`);
  throw new Error(
    `Configuration error: environment variable "${missingVar}" is not defined. ` +
      'Set it in your .env file before starting the dev server.'
  );
}

/** Singleton Axios instance shared by all API functions. */
const apiClient = axios.create({
  baseURL,
});

/**
 * Strip keys whose value is undefined, null, or empty string.
 * Requirement 9.2 — only defined, non-empty filter values reach the query string.
 *
 * @param {Record<string, unknown>} [filters={}]
 * @returns {Record<string, string | number | boolean>}
 */
function cleanFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

/**
 * Fetch all tasks, optionally filtered.
 * Requirement 9.2, 9.3
 *
 * @param {{ status?: string, priority?: string, sort?: string, search?: string }} [filters]
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function getAllTasks(filters) {
  try {
    return await apiClient.get('/api/tasks', { params: cleanFilters(filters) });
  } catch (error) {
    throw error; // Requirement 9.8
  }
}

/**
 * Fetch a single task by ID.
 * Requirement 9.4
 *
 * @param {string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function getTaskById(id) {
  try {
    return await apiClient.get(`/api/tasks/${id}`);
  } catch (error) {
    throw error; // Requirement 9.8
  }
}

/**
 * Create a new task.
 * Requirement 9.5
 *
 * @param {object} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function createTask(data) {
  try {
    return await apiClient.post('/api/tasks', data);
  } catch (error) {
    throw error; // Requirement 9.8
  }
}

/**
 * Update an existing task.
 * Requirement 9.6
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function updateTask(id, data) {
  try {
    return await apiClient.put(`/api/tasks/${id}`, data);
  } catch (error) {
    throw error; // Requirement 9.8
  }
}

/**
 * Delete a task by ID.
 * Requirement 9.7
 *
 * @param {string} id
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function deleteTask(id) {
  try {
    return await apiClient.delete(`/api/tasks/${id}`);
  } catch (error) {
    throw error; // Requirement 9.8
  }
}

/**
 * Persist a new task order by sending the ordered IDs to the server.
 * The server performs a bulk-write updating the `order` field on each task.
 * Requirements: 16.2
 *
 * @param {string[]} orderedIds — task IDs in the desired display order
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function reorderTasks(orderedIds) {
  try {
    return await apiClient.patch('/api/tasks/reorder', { orderedIds });
  } catch (error) {
    throw error; // Requirement 9.8
  }
}
