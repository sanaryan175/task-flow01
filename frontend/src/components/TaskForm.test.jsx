// Feature: task-manager-app
// Unit tests for TaskForm validation and submission logic
// Requirements: 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';
import Toast from './Toast';
import { ToastProvider } from '../context/ToastContext';

// Helper: render TaskForm wrapped in ToastProvider (with Toast so notifications appear in DOM)
function renderForm(props = {}) {
  const defaults = {
    addTask: vi.fn().mockResolvedValue(undefined),
    editTask: vi.fn().mockResolvedValue(undefined),
    onSuccess: vi.fn(),
    onClose: vi.fn(),
  };
  const merged = { ...defaults, ...props };
  const utils = render(
    <ToastProvider>
      <TaskForm {...merged} />
      <Toast />
    </ToastProvider>
  );
  return { ...utils, ...merged };
}

// ---------------------------------------------------------------------------
// Requirement 11.4 — title validation (3–100 chars after trim)
// ---------------------------------------------------------------------------
describe('Title validation (Req 11.4)', () => {
  it('shows an error when title is empty and blocks submit', async () => {
    const { addTask } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /title must be at least 3 characters/i
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('shows an error when title is only whitespace', async () => {
    const { addTask } = renderForm();
    await userEvent.type(screen.getByLabelText(/title/i), '   ');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /title must be at least 3 characters/i
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('shows an error when title is 1 char (too short)', async () => {
    const { addTask } = renderForm();
    await userEvent.type(screen.getByLabelText(/title/i), 'ab');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /title must be at least 3 characters/i
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('shows an error when title exceeds 100 chars', async () => {
    const { addTask } = renderForm();
    await userEvent.type(screen.getByLabelText(/title/i), 'a'.repeat(101));
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /title must not exceed 100 characters/i
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('accepts a title with exactly 3 chars', async () => {
    const { addTask } = renderForm();
    await userEvent.type(screen.getByLabelText(/title/i), 'abc');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
  });

  it('accepts a title with exactly 100 chars', async () => {
    const { addTask } = renderForm();
    await userEvent.type(screen.getByLabelText(/title/i), 'a'.repeat(100));
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// Requirement 11.5 — description validation (≤ 500 chars)
// ---------------------------------------------------------------------------
describe('Description validation (Req 11.5)', () => {
  it('shows an error when description exceeds 500 chars', async () => {
    const { addTask } = renderForm();
    // Use fireEvent.change for large inputs to avoid userEvent.type timeout
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'x'.repeat(501) } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /description must not exceed 500 characters/i
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('accepts a description with exactly 500 chars', async () => {
    const { addTask } = renderForm();
    // Use fireEvent.change for large inputs to avoid userEvent.type timeout
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Valid Title' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'x'.repeat(500) } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// Requirement 11.7 — create mode: calls addTask, closes modal, resets fields
// ---------------------------------------------------------------------------
describe('Create mode submission (Req 11.7)', () => {
  it('calls addTask with trimmed title and field values on valid submit', async () => {
    const addTask = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderForm({ addTask, onSuccess, onClose });

    // Use fireEvent.change to set input value directly (avoids char-by-char issues)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: '  My Task  ' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
    expect(addTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Task' })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Requirement 11.8 — edit mode: calls editTask with task._id, closes modal
// ---------------------------------------------------------------------------
describe('Edit mode submission (Req 11.8)', () => {
  const existingTask = {
    _id: 'abc123',
    title: 'Old Title',
    description: 'Old description',
    status: 'todo',
    priority: 'medium',
    dueDate: null,
  };

  it('calls editTask with the task id and updated data on valid submit', async () => {
    const editTask = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderForm({ task: existingTask, editTask, onSuccess, onClose });

    // Use fireEvent.change to set value directly (avoids userEvent.type char-by-char issues)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Title' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(editTask).toHaveBeenCalledTimes(1));
    expect(editTask).toHaveBeenCalledWith(
      'abc123',
      expect.objectContaining({ title: 'New Title' })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pre-populates all fields from the task prop (Req 11.3)', () => {
    renderForm({ task: existingTask });
    expect(screen.getByLabelText(/title/i)).toHaveValue('Old Title');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Old description');
  });
});

// ---------------------------------------------------------------------------
// Requirement 11.9 — submit button disabled while submitting
// ---------------------------------------------------------------------------
describe('Submit button disabled during submission (Req 11.9)', () => {
  it('disables the submit button while the async call is in-flight', async () => {
    let resolveAdd;
    const addTask = vi.fn(
      () => new Promise((resolve) => { resolveAdd = resolve; })
    );
    renderForm({ addTask });

    await userEvent.type(screen.getByLabelText(/title/i), 'Test Task');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    // Button should be disabled (showing "Saving…") immediately after click
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    // Resolve the promise and confirm button re-enables
    resolveAdd();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /saving/i })).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Requirement 11.10 — API error: show toast, preserve field values
// ---------------------------------------------------------------------------
describe('API error handling (Req 11.10)', () => {
  it('shows a toast on API failure and preserves field values', async () => {
    const addTask = vi.fn().mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });
    renderForm({ addTask });

    // Use fireEvent.change to avoid character-by-character typing issues
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Failing Task' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    // Field value is preserved
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('Failing Task');
    });

    // Toast message is shown (rendered by ToastProvider)
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows a generic toast message when error has no response body', async () => {
    const addTask = vi.fn().mockRejectedValue(new Error('Network failure'));
    renderForm({ addTask });

    // Use fireEvent.change to avoid character-by-character typing issues
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Another Task' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });
  });
});
