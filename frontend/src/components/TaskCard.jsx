import { useState } from 'react';
import PropTypes from 'prop-types';

// Status config: badge colors + icons
const STATUS_CONFIG = {
  todo: {
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600',
    dot: 'bg-slate-400',
    label: 'To Do',
  },
  'in-progress': {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700',
    dot: 'bg-blue-500',
    label: 'In Progress',
  },
  done: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Done',
  },
};

// Priority config: badge colors + visual weight
const PRIORITY_CONFIG = {
  low: {
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-700',
    bar: 'bg-teal-400',
    label: 'Low',
    bars: 1,
  },
  medium: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-700',
    bar: 'bg-amber-400',
    label: 'Medium',
    bars: 2,
  },
  high: {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-700',
    bar: 'bg-rose-500',
    label: 'High',
    bars: 3,
  },
};

// Left-border accent per priority
const PRIORITY_BORDER = {
  low: 'border-l-teal-400',
  medium: 'border-l-amber-400',
  high: 'border-l-rose-500',
};

function truncate(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function isTaskOverdue(task) {
  return (
    Boolean(task.dueDate) &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date(new Date().toDateString())
  );
}

/** Small priority signal bars (like signal strength). */
function PriorityBars({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="inline-flex items-end gap-0.5 h-3 ml-1" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`inline-block rounded-sm w-1 transition-all ${
            n <= cfg.bars ? cfg.bar : 'bg-gray-200 dark:bg-gray-600'
          }`}
          style={{ height: `${n * 4}px` }}
        />
      ))}
    </span>
  );
}

PriorityBars.propTypes = { priority: PropTypes.string.isRequired };

/**
 * TaskCard – polished card with priority accent, animated delete confirm, and hover effects.
 * Requirements: 12.1–12.8, 19.5, 19.6
 */
function TaskCard({ task, onEdit, removeTask }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const overdue = isTaskOverdue(task);
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const borderAccent = PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.medium;
  const isDone = task.status === 'done';

  return (
    <article
      className={`
        group relative bg-white dark:bg-gray-800/90 rounded-xl shadow-sm
        border border-gray-100 dark:border-gray-700/60
        border-l-4 ${borderAccent}
        flex flex-col gap-3 p-4
        card-hover animate-fade-up
        ${isDone ? 'opacity-75' : ''}
      `}
    >
      {/* Overdue ribbon */}
      {overdue && (
        <div className="absolute -top-0 right-3 -translate-y-1/2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm uppercase tracking-wider animate-pulse">
            ⚠ Overdue
          </span>
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold leading-snug break-words ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {task.title}
        </h3>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {truncate(task.description, 80)}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
          {statusCfg.label}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityCfg.badge}`}>
          {priorityCfg.label}
          <PriorityBars priority={task.priority} />
        </span>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        {task.dueDate && (
          <span className={overdue ? 'text-rose-500 font-medium' : ''}>
            📅 Due: {formatDate(task.dueDate)}
          </span>
        )}
        <span>🕐 Created: {formatDate(task.createdAt)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/50">
        {confirmingDelete ? (
          <div className="flex items-center gap-2 w-full animate-scale-in">
            <span className="flex-1 text-[11px] text-gray-500 dark:text-gray-400">
              Delete this task?
            </span>
            <button
              type="button"
              onClick={() => { removeTask(task._id); setConfirmingDelete(false); }}
              aria-label={`Confirm delete ${task.title}`}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              aria-label="Cancel delete"
              className="px-3 py-1 rounded-lg text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${task.title}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
                         text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30
                         hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                         active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Delete ${task.title}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium
                         text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30
                         hover:bg-rose-100 dark:hover:bg-rose-900/50
                         active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['todo', 'in-progress', 'done']).isRequired,
    priority: PropTypes.oneOf(['low', 'medium', 'high']).isRequired,
    dueDate: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  removeTask: PropTypes.func.isRequired,
};

export default TaskCard;
