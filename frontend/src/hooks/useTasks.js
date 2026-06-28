// Feature: task-manager-app
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import * as TaskApi from '../api/taskApi';

/**
 * Custom hook that manages task state and exposes CRUD operations.
 *
 * Requirements: 10.1–10.5, 10.7–10.9
 *
 * State:
 *   tasks   — array of task objects (Requirement 10.1, 10.2)
 *   loading — boolean; true while any API call is in-flight (Requirement 10.7)
 *   error   — null on success, descriptive string on failure (Requirement 10.8, 10.9)
 *
 * Exposed functions (this task):
 *   fetchTasks, addTask, editTask
 *
 * Functions added in task 8.2:
 *   removeTask, reorderTasks
 */
export function useTasks() {
  // Requirement 10.2 — initial state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all tasks, optionally passing filter/sort parameters.
   * Requirement 10.3 — calls TaskApi.getAllTasks and updates tasks state.
   *
   * @param {{ status?: string, priority?: string, sort?: string, search?: string }} [filters]
   */
  const fetchTasks = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await TaskApi.getAllTasks(filters);
      setTasks(response.data.data);
      setError(null); // Requirement 10.9
    } catch (err) {
      // Requirement 10.8 — non-empty string identifying the operation + API reason
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to fetch tasks: ${reason}`);
    } finally {
      setLoading(false); // Requirement 10.7
    }
  }, []);

  /**
   * Create a new task and append it to the tasks array.
   * Requirement 10.4 — appends returned task without page refresh.
   *
   * @param {object} data — task fields to create
   */
  const addTask = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await TaskApi.createTask(data);
      const newTask = response.data.data;
      setTasks((prev) => [...prev, newTask]); // Requirement 10.4 — append
      setError(null); // Requirement 10.9
    } catch (err) {
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to add task: ${reason}`); // Requirement 10.8
    } finally {
      setLoading(false); // Requirement 10.7
    }
  }, []);

  /**
   * Update an existing task in place.
   * Requirement 10.5 — replaces matching task by _id without page refresh.
   *
   * @param {string} id   — task _id to update
   * @param {object} data — fields to update
   */
  const editTask = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await TaskApi.updateTask(id, data);
      const updatedTask = response.data.data;
      setTasks((prev) =>
        prev.map((task) => (task._id === id ? updatedTask : task))
      ); // Requirement 10.5 — replace matching task
      setError(null); // Requirement 10.9
    } catch (err) {
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to edit task: ${reason}`); // Requirement 10.8
    } finally {
      setLoading(false); // Requirement 10.7
    }
  }, []);

  /**
   * Optimistically remove a task from the list, then delete it via the API.
   * On failure, restores the task to its original position.
   * Requirement 10.6 — optimistic remove with rollback to original index order.
   *
   * @param {string} id — task _id to remove
   */
  const removeTask = useCallback(async (id) => {
    // Capture the current tasks snapshot for potential rollback
    const snapshot = tasks.slice();

    // Optimistic update — remove task immediately before API responds
    setTasks((prev) => prev.filter((task) => task._id !== id));

    setLoading(true);
    try {
      await TaskApi.deleteTask(id);
      setError(null); // Requirement 10.9
    } catch (err) {
      // Requirement 10.6 — restore original tasks array (including original index order)
      setTasks(snapshot);
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to remove task: ${reason}`); // Requirement 10.8
    } finally {
      setLoading(false); // Requirement 10.7
    }
  }, [tasks]);

  /**
   * Optimistically reorder tasks by moving an item from oldIndex to newIndex,
   * then persisting the new order to the server via PATCH /api/tasks/reorder.
   * On failure, restores the pre-drag task order.
   * Requirements: 16.2, 16.3
   *
   * @param {number} oldIndex — index of the dragged task before the move
   * @param {number} newIndex — index where the task was dropped
   */
  const reorderTasks = useCallback(async (oldIndex, newIndex) => {
    // Capture the current tasks snapshot for potential rollback
    const snapshot = tasks.slice();

    // Optimistic update using @dnd-kit/sortable's arrayMove helper
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);

    setLoading(true);
    try {
      const orderedIds = reordered.map((task) => task._id);
      await TaskApi.reorderTasks(orderedIds);
      setError(null); // Requirement 10.9
    } catch (err) {
      // Requirement 16.3 — restore pre-drag order on server failure
      setTasks(snapshot);
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to reorder tasks: ${reason}`); // Requirement 10.8
    } finally {
      setLoading(false); // Requirement 10.7
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    editTask,
    removeTask,
    reorderTasks,
  };
}

export default useTasks;
