// Feature: task-manager-app
// Unit tests for useTasks hook — fetchTasks, addTask, editTask
// Requirements: 10.1–10.5, 10.7–10.9

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the entire TaskApi module so the Axios singleton (which throws on missing
// VITE_API_BASE_URL) is never executed in the test environment.
vi.mock('../api/taskApi', () => ({
  getAllTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import * as TaskApi from '../api/taskApi';
import { useTasks } from './useTasks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeTask = (overrides = {}) => ({
  _id: 'task-1',
  title: 'Test task',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  order: 0,
  ...overrides,
});

const apiSuccess = (data) =>
  Promise.resolve({ data: { success: true, data } });

const apiError = (message = 'Server error') =>
  Promise.reject({
    response: { data: { message } },
    message,
  });

// ---------------------------------------------------------------------------
// Initial state (Requirement 10.2)
// ---------------------------------------------------------------------------
describe('useTasks — initial state', () => {
  it('initialises tasks as empty array, loading as false, error as null (Req 10.2)', () => {
    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('exposes fetchTasks, addTask, editTask functions (Req 10.1)', () => {
    const { result } = renderHook(() => useTasks());

    expect(typeof result.current.fetchTasks).toBe('function');
    expect(typeof result.current.addTask).toBe('function');
    expect(typeof result.current.editTask).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// fetchTasks (Requirement 10.3, 10.7, 10.8, 10.9)
// ---------------------------------------------------------------------------
describe('fetchTasks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls TaskApi.getAllTasks and updates tasks state on success (Req 10.3)', async () => {
    const tasks = [makeTask({ _id: 'a' }), makeTask({ _id: 'b' })];
    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: tasks } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(TaskApi.getAllTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks).toEqual(tasks);
  });

  it('passes filters through to TaskApi.getAllTasks (Req 10.3)', async () => {
    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [] } });
    const filters = { status: 'todo', priority: 'high' };

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks(filters);
    });

    expect(TaskApi.getAllTasks).toHaveBeenCalledWith(filters);
  });

  it('sets loading true during fetch and false after (Req 10.7)', async () => {
    let resolveApi;
    const pendingPromise = new Promise((res) => { resolveApi = res; });
    TaskApi.getAllTasks.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useTasks());

    // Start the fetch but don't await it yet
    let fetchPromise;
    act(() => {
      fetchPromise = result.current.fetchTasks();
    });

    // loading should be true while in-flight
    expect(result.current.loading).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolveApi({ data: { success: true, data: [] } });
      await fetchPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears error to null on success (Req 10.9)', async () => {
    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.error).toBeNull();
  });

  it('sets error string on failure (Req 10.8)', async () => {
    TaskApi.getAllTasks.mockRejectedValueOnce({
      response: { data: { message: 'DB connection lost' } },
    });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.error).toBeTypeOf('string');
    expect(result.current.error.length).toBeGreaterThan(0);
    expect(result.current.error).toContain('DB connection lost');
  });

  it('restores loading to false even on failure (Req 10.7)', async () => {
    TaskApi.getAllTasks.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.loading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addTask (Requirement 10.4, 10.7, 10.8, 10.9)
// ---------------------------------------------------------------------------
describe('addTask', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appends the returned task to tasks array without replacing existing (Req 10.4)', async () => {
    const existing = makeTask({ _id: 'existing' });
    const newTask = makeTask({ _id: 'new-task', title: 'New' });

    // Prime the hook with one existing task
    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [existing] } });
    TaskApi.createTask.mockResolvedValueOnce({ data: { success: true, data: newTask } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.addTask({ title: 'New' });
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0]._id).toBe('existing');
    expect(result.current.tasks[1]._id).toBe('new-task');
  });

  it('calls TaskApi.createTask with the provided data (Req 10.4)', async () => {
    const newTask = makeTask({ _id: 'x' });
    TaskApi.createTask.mockResolvedValueOnce({ data: { success: true, data: newTask } });

    const { result } = renderHook(() => useTasks());
    const taskData = { title: 'Buy milk', status: 'todo', priority: 'low' };

    await act(async () => {
      await result.current.addTask(taskData);
    });

    expect(TaskApi.createTask).toHaveBeenCalledWith(taskData);
  });

  it('sets loading true during addTask and false after (Req 10.7)', async () => {
    let resolveApi;
    const pendingPromise = new Promise((res) => { resolveApi = res; });
    TaskApi.createTask.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useTasks());

    let addPromise;
    act(() => {
      addPromise = result.current.addTask({ title: 'Task' });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveApi({ data: { success: true, data: makeTask() } });
      await addPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('sets error to null on addTask success (Req 10.9)', async () => {
    TaskApi.createTask.mockResolvedValueOnce({
      data: { success: true, data: makeTask() },
    });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: 'Task' });
    });

    expect(result.current.error).toBeNull();
  });

  it('sets error string on addTask failure (Req 10.8)', async () => {
    TaskApi.createTask.mockRejectedValueOnce({
      response: { data: { message: 'Title is required' } },
    });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({});
    });

    expect(result.current.error).toBeTypeOf('string');
    expect(result.current.error.length).toBeGreaterThan(0);
    expect(result.current.error).toContain('Title is required');
  });

  it('restores loading to false on addTask failure (Req 10.7)', async () => {
    TaskApi.createTask.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: 'Task' });
    });

    expect(result.current.loading).toBe(false);
  });

  it('does not remove existing tasks when addTask fails (Req 10.4)', async () => {
    const existing = makeTask({ _id: 'existing' });
    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [existing] } });
    TaskApi.createTask.mockRejectedValueOnce(new Error('Server down'));

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.addTask({ title: 'New' });
    });

    // Existing tasks must be preserved on failure
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]._id).toBe('existing');
  });
});

// ---------------------------------------------------------------------------
// editTask (Requirement 10.5, 10.7, 10.8, 10.9)
// ---------------------------------------------------------------------------
describe('editTask', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces matching task in tasks array by _id (Req 10.5)', async () => {
    const task1 = makeTask({ _id: 'a', title: 'Original' });
    const task2 = makeTask({ _id: 'b', title: 'Other' });
    const updatedTask1 = { ...task1, title: 'Updated' };

    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [task1, task2] } });
    TaskApi.updateTask.mockResolvedValueOnce({ data: { success: true, data: updatedTask1 } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.editTask('a', { title: 'Updated' });
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].title).toBe('Updated');
    expect(result.current.tasks[1].title).toBe('Other');
  });

  it('does not mutate other tasks when editing one (Req 10.5)', async () => {
    const task1 = makeTask({ _id: 'a', title: 'First' });
    const task2 = makeTask({ _id: 'b', title: 'Second' });
    const updatedTask1 = { ...task1, title: 'First Updated' };

    TaskApi.getAllTasks.mockResolvedValueOnce({ data: { success: true, data: [task1, task2] } });
    TaskApi.updateTask.mockResolvedValueOnce({ data: { success: true, data: updatedTask1 } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.editTask('a', { title: 'First Updated' });
    });

    // task2 should be untouched
    expect(result.current.tasks[1]).toEqual(task2);
  });

  it('calls TaskApi.updateTask with correct id and data (Req 10.5)', async () => {
    const task = makeTask({ _id: 'abc' });
    TaskApi.updateTask.mockResolvedValueOnce({ data: { success: true, data: task } });

    const { result } = renderHook(() => useTasks());
    const updateData = { title: 'Updated title', status: 'done' };

    await act(async () => {
      await result.current.editTask('abc', updateData);
    });

    expect(TaskApi.updateTask).toHaveBeenCalledWith('abc', updateData);
  });

  it('sets loading true during editTask and false after (Req 10.7)', async () => {
    let resolveApi;
    const pendingPromise = new Promise((res) => { resolveApi = res; });
    TaskApi.updateTask.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useTasks());

    let editPromise;
    act(() => {
      editPromise = result.current.editTask('x', { title: 'Updated' });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveApi({ data: { success: true, data: makeTask({ _id: 'x' }) } });
      await editPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('sets error to null on editTask success (Req 10.9)', async () => {
    const task = makeTask({ _id: 'z' });
    TaskApi.updateTask.mockResolvedValueOnce({ data: { success: true, data: task } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.editTask('z', { status: 'done' });
    });

    expect(result.current.error).toBeNull();
  });

  it('sets error string on editTask failure (Req 10.8)', async () => {
    TaskApi.updateTask.mockRejectedValueOnce({
      response: { data: { message: 'Task not found' } },
    });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.editTask('nonexistent', { status: 'done' });
    });

    expect(result.current.error).toBeTypeOf('string');
    expect(result.current.error.length).toBeGreaterThan(0);
    expect(result.current.error).toContain('Task not found');
  });

  it('restores loading to false on editTask failure (Req 10.7)', async () => {
    TaskApi.updateTask.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.editTask('x', { title: 'Test' });
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears a prior error after a successful editTask (Req 10.9)', async () => {
    // First, set an error via a failed fetch
    TaskApi.getAllTasks.mockRejectedValueOnce(new Error('Network error'));

    const task = makeTask({ _id: 'y' });
    TaskApi.updateTask.mockResolvedValueOnce({ data: { success: true, data: task } });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.editTask('y', { status: 'done' });
    });

    expect(result.current.error).toBeNull();
  });
});
