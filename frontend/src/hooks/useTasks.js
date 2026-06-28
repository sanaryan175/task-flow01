// Feature: task-manager-app
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import * as TaskApi from '../api/taskApi';

export function useTasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ---------- fetchTasks ----------
  const fetchTasks = useCallback(async (filters) => {
    setLoading(true);
    try {
      const response = await TaskApi.getAllTasks(filters);
      setTasks(response.data.data);
      setError(null);
    } catch (err) {
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to fetch tasks: ${reason}`);
      // Don't re-throw — fetch errors are shown via the error state → Toast in Home
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- addTask ----------
  const addTask = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await TaskApi.createTask(data);
      const newTask = response.data.data;
      setTasks((prev) => [...prev, newTask]);
      setError(null);
    } catch (err) {
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to add task: ${reason}`);
      throw err; // re-throw so TaskForm can show a toast
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- editTask ----------
  const editTask = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await TaskApi.updateTask(id, data);
      const updatedTask = response.data.data;
      setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));
      setError(null);
    } catch (err) {
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to edit task: ${reason}`);
      throw err; // re-throw so TaskForm can show a toast
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- removeTask (optimistic) ----------
  const removeTask = useCallback(async (id) => {
    const snapshot = tasks.slice();
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setLoading(true);
    try {
      await TaskApi.deleteTask(id);
      setError(null);
    } catch (err) {
      setTasks(snapshot);
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to remove task: ${reason}`);
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  // ---------- reorderTasks (optimistic) ----------
  const reorderTasks = useCallback(async (oldIndex, newIndex) => {
    const snapshot = tasks.slice();
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);
    setLoading(true);
    try {
      await TaskApi.reorderTasks(reordered.map((t) => t._id));
      setError(null);
    } catch (err) {
      setTasks(snapshot);
      const reason = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      setError(`Failed to reorder tasks: ${reason}`);
    } finally {
      setLoading(false);
    }
  }, [tasks]);

  return { tasks, loading, error, fetchTasks, addTask, editTask, removeTask, reorderTasks };
}

export default useTasks;
