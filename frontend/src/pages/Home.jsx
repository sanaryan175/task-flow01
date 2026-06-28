// Feature: task-manager-app
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import useTasks from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

const STAT_CONFIG = [
  { key: 'total',      label: 'Total',       icon: '📋', gradient: 'from-indigo-500 to-purple-600',   ring: 'ring-indigo-200 dark:ring-indigo-700' },
  { key: 'todo',       label: 'To Do',       icon: '🕐', gradient: 'from-slate-400 to-slate-600',     ring: 'ring-slate-200 dark:ring-slate-600' },
  { key: 'inProgress', label: 'In Progress', icon: '🔄', gradient: 'from-blue-500 to-cyan-500',        ring: 'ring-blue-200 dark:ring-blue-700' },
  { key: 'done',       label: 'Done',        icon: '✅', gradient: 'from-emerald-400 to-teal-500',    ring: 'ring-emerald-200 dark:ring-emerald-700' },
];

function StatTile({ label, count, icon, gradient, ring }) {
  return (
    <div className={`
      relative flex flex-col items-center justify-center rounded-2xl p-4
      bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60
      shadow-sm ring-2 ${ring}
      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
    `}>
      {/* Gradient icon bubble */}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-sm mb-2`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{count}</span>
      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

StatTile.propTypes = {
  label:    PropTypes.string.isRequired,
  count:    PropTypes.number.isRequired,
  icon:     PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired,
  ring:     PropTypes.string.isRequired,
};

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 h-44 border-l-4 border-l-gray-200 dark:border-l-gray-600">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-4/5" />
        <div className="flex gap-2 mt-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div role="status" aria-label="Loading tasks" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map((n) => <SkeletonCard key={n} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNewTask }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-up">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-4xl shadow-inner">
        📭
      </div>
      <div>
        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No tasks yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first task to get started.</p>
      </div>
      <button
        type="button"
        onClick={onNewTask}
        className="mt-1 px-6 py-2.5 text-sm font-semibold rounded-xl
                   bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                   hover:from-indigo-600 hover:to-purple-700
                   active:scale-95 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/30
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        + Add your first task
      </button>
    </div>
  );
}

EmptyState.propTypes = { onNewTask: PropTypes.func.isRequired };

// ---------------------------------------------------------------------------
// Sortable task card wrapper
// ---------------------------------------------------------------------------

function SortableTaskCard({ task, onEdit, removeTask, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    userSelect: isDragging ? 'none' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={!disabled ? 'cursor-grab active:cursor-grabbing' : undefined}
    >
      <TaskCard task={task} onEdit={onEdit} removeTask={removeTask} />
    </div>
  );
}

SortableTaskCard.propTypes = {
  task:       PropTypes.object.isRequired,
  onEdit:     PropTypes.func.isRequired,
  removeTask: PropTypes.func.isRequired,
  disabled:   PropTypes.bool.isRequired,
};

// ---------------------------------------------------------------------------
// Dark mode icons
// ---------------------------------------------------------------------------

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71m12.02 0-.71-.71M6.34 6.34l-.71-.71M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// User dropdown menu in navbar
// ---------------------------------------------------------------------------

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);

  // Close on click outside
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl
                   bg-indigo-50 dark:bg-indigo-900/30
                   border border-indigo-100 dark:border-indigo-700/50
                   hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                   active:scale-95 transition-all
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {/* User icon circle with initial */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initial}
        </div>
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 max-w-[90px] truncate hidden sm:block">
          {user?.name}
        </span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 text-indigo-400 transition-transform duration-200 hidden sm:block ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-gray-800
                        border border-gray-100 dark:border-gray-700/60
                        shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50
                        animate-scale-in z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                              flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                         text-rose-600 dark:text-rose-400
                         hover:bg-rose-50 dark:hover:bg-rose-900/20
                         active:scale-[0.98] transition-all
                         focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {/* Logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

UserMenu.propTypes = {
  user:     PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }).isRequired,
  onLogout: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

function Home() {
  const { tasks, loading, error, fetchTasks, addTask, editTask, removeTask, reorderTasks } = useTasks();
  const { showToast } = useToast();
  const { user, logout } = useAuth();

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingTask, setEditingTask]   = useState(null);
  const [filterActive, setFilterActive] = useState(false);
  const [activeTask, setActiveTask]     = useState(null);
  const currentFiltersRef = useRef({ search: '', status: '', priority: '', sort: 'createdAt_desc' });

  const handleFetchTasks = useCallback((filters) => {
    currentFiltersRef.current = filters ?? {};
    const f = filters ?? {};
    setFilterActive(Boolean(f.status || f.priority || f.search || (f.sort && f.sort !== 'createdAt_desc')));
    fetchTasks(filters);
  }, [fetchTasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const indexById = useCallback((id) => tasks.findIndex((t) => t._id === id), [tasks]);

  const handleDragStart = useCallback(({ active }) => {
    setActiveTask(tasks.find((t) => t._id === active.id) ?? null);
  }, [tasks]);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;
    const oldIndex = indexById(active.id);
    const newIndex = indexById(over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderTasks(oldIndex, newIndex);
  }, [indexById, reorderTasks]);

  const handleDragCancel = useCallback(() => setActiveTask(null), []);

  const stats = useMemo(() => ({
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
  }), [tasks]);

  useEffect(() => { if (error) showToast(error, 'error'); }, [error, showToast]);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('themePreference', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const openCreateModal = useCallback(() => { setEditingTask(null); setIsModalOpen(true); }, []);
  const openEditModal   = useCallback((task) => { setEditingTask(task); setIsModalOpen(true); }, []);
  const closeModal      = useCallback(() => { setIsModalOpen(false); setEditingTask(null); }, []);

  const handleFormSuccess = useCallback(() => {
    showToast(editingTask ? 'Task updated!' : 'Task created!', 'success');
  }, [editingTask, showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <Toast />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-gray-100/80 dark:border-gray-700/60">
        {/* Glass background */}
        <div className="glass dark:glass-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            {/* Logo + wordmark */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
                ✓
              </div>
              <div>
                <h1 className="text-lg font-extrabold leading-none gradient-text">TaskFlow</h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Manage your work</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                           text-gray-500 dark:text-gray-400
                           bg-gray-100 dark:bg-gray-800
                           hover:bg-gray-200 dark:hover:bg-gray-700
                           active:scale-90 transition-all
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* New task button */}
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl
                           bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                           hover:from-indigo-600 hover:to-purple-700
                           active:scale-95 btn-pulse transition-all
                           focus:outline-none focus:ring-2 focus:ring-indigo-500
                           shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
              >
                <span aria-hidden="true" className="text-base leading-none">+</span>
                New Task
              </button>

              {/* User dropdown menu */}
              <UserMenu user={user} onLogout={logout} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Stats */}
        <section aria-label="Task statistics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CONFIG.map(({ key, label, icon, gradient, ring }) => (
              <StatTile key={key} label={label} count={stats[key]} icon={icon} gradient={gradient} ring={ring} />
            ))}
          </div>
        </section>

        {/* Progress bar — visual summary */}
        {stats.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-400 font-medium">
              <span>Overall progress</span>
              <span>{Math.round((stats.done / stats.total) * 100)}% done</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                style={{ width: `${(stats.done / stats.total) * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Drag hint */}
        {!filterActive && tasks.length > 1 && (
          <p className="text-[11px] text-center text-gray-400 dark:text-gray-600 flex items-center justify-center gap-1">
            <span aria-hidden="true">↕</span> Drag cards to reorder your tasks
          </p>
        )}

        {/* Filter bar */}
        <FilterBar fetchTasks={handleFetchTasks} />

        {/* Task grid */}
        <section aria-label="Task list">
          {loading ? (
            <LoadingIndicator />
          ) : tasks.length === 0 ? (
            <EmptyState onNewTask={openCreateModal} />
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={tasks.map((t) => t._id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <SortableTaskCard
                      key={task._id}
                      task={task}
                      onEdit={() => openEditModal(task)}
                      removeTask={removeTask}
                      disabled={filterActive}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeTask ? (
                  <div className="opacity-95 shadow-2xl rotate-1 scale-105 pointer-events-none">
                    <TaskCard task={activeTask} onEdit={() => {}} removeTask={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-6" />

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTask ? '✏️ Edit Task' : '✨ New Task'}>
        <TaskForm
          task={editingTask}
          addTask={addTask}
          editTask={editTask}
          onSuccess={handleFormSuccess}
          onClose={closeModal}
        />
      </Modal>
    </div>
  );
}

export default Home;
