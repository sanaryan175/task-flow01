// Feature: task-manager-app
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useToast } from '../context/ToastContext';

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

/** Styled label */
function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}
Label.propTypes = { htmlFor: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

/** Styled input base classes */
const inputBase =
  'w-full rounded-lg border bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

const inputNormal = `${inputBase} border-gray-200 dark:border-gray-600`;
const inputError  = `${inputBase} border-rose-400 dark:border-rose-500 ring-1 ring-rose-300 dark:ring-rose-500/50`;

/** Inline error message */
function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[11px] font-medium text-rose-500 flex items-center gap-1">
      <span aria-hidden="true">⚠</span> {message}
    </p>
  );
}
FieldError.propTypes = { id: PropTypes.string.isRequired, message: PropTypes.string };

/**
 * TaskForm – polished create/edit form with smooth validation feedback.
 * Requirements: 11.1–11.10, 19.1
 */
function TaskForm({ task = null, addTask, editTask, onSuccess, onClose }) {
  const [title, setTitle]           = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus]         = useState(task?.status ?? 'todo');
  const [priority, setPriority]     = useState(task?.priority ?? 'medium');
  const [dueDate, setDueDate]       = useState(toDateInputValue(task?.dueDate));
  const [errors, setErrors]         = useState({ title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const validate = () => {
    const errs = { title: '', description: '', dueDate: '' };
    const trimmed = title.trim();
    if (trimmed.length < 3)        errs.title = 'Title must be at least 3 characters.';
    else if (trimmed.length > 100) errs.title = 'Title must not exceed 100 characters.';
    if (description.length > 500)  errs.description = 'Description must not exceed 500 characters.';
    if (dueDate && isNaN(new Date(dueDate).getTime())) errs.dueDate = 'Enter a valid date.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSubmitting(true);
    const payload = { title: title.trim(), description, status, priority, dueDate: dueDate || undefined };
    try {
      if (task) {
        await editTask(task._id, payload);
      } else {
        await addTask(payload);
        setTitle(''); setDescription(''); setStatus('todo'); setPriority('medium'); setDueDate('');
        setErrors({ title: '', description: '', dueDate: '' });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? 'An unexpected error occurred.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = description.length;
  const charOverLimit = charCount > 500;

  return (
    <form aria-label={task ? 'Edit task' : 'Create task'} noValidate onSubmit={handleSubmit} className="space-y-4">

      {/* Title */}
      <div>
        <Label htmlFor="task-title">Title <span className="text-rose-400">*</span></Label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-describedby={errors.title ? 'task-title-error' : undefined}
          aria-invalid={errors.title ? 'true' : undefined}
          className={errors.title ? inputError : inputNormal}
        />
        <FieldError id="task-title-error" message={errors.title} />
      </div>

      {/* Description */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <Label htmlFor="task-description">Description</Label>
          <span className={`text-[10px] ${charOverLimit ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
            {charCount}/500
          </span>
        </div>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some details… (optional)"
          rows={3}
          aria-describedby={errors.description ? 'task-description-error' : undefined}
          aria-invalid={errors.description ? 'true' : undefined}
          className={`${errors.description ? inputError : inputNormal} resize-none`}
        />
        <FieldError id="task-description-error" message={errors.description} />
      </div>

      {/* Status + Priority side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="task-status">Status</Label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputNormal}
          >
            <option value="todo">📋 To Do</option>
            <option value="in-progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>
        <div>
          <Label htmlFor="task-priority">Priority</Label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={inputNormal}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <Label htmlFor="task-due-date">Due Date</Label>
        <input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
          aria-invalid={errors.dueDate ? 'true' : undefined}
          className={errors.dueDate ? inputError : inputNormal}
        />
        <FieldError id="task-due-date-error" message={errors.dueDate} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                     active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-semibold rounded-lg text-white
                     bg-gradient-to-r from-indigo-500 to-purple-600
                     hover:from-indigo-600 hover:to-purple-700
                     active:scale-95 transition-all
                     focus:outline-none focus:ring-2 focus:ring-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving…
            </span>
          ) : task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

TaskForm.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.oneOf(['todo', 'in-progress', 'done']),
    priority: PropTypes.oneOf(['low', 'medium', 'high']),
    dueDate: PropTypes.string,
  }),
  addTask: PropTypes.func,
  editTask: PropTypes.func,
  onSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TaskForm;
