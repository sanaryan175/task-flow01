// Feature: task-manager-app
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const STORAGE_KEY = 'taskFilters';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  priority: '',
  sort: 'createdAt_desc',
};

const SORT_OPTIONS = [
  { label: '🕐 Newest first', value: 'createdAt_desc' },
  { label: '🕙 Oldest first', value: 'createdAt_asc' },
  { label: '📅 Due date', value: 'dueDate_asc' },
  { label: '🔴 Priority', value: 'priority_desc' },
];

function loadFiltersFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_FILTERS };
    return {
      search:   typeof parsed.search   === 'string' ? parsed.search   : DEFAULT_FILTERS.search,
      status:   typeof parsed.status   === 'string' ? parsed.status   : DEFAULT_FILTERS.status,
      priority: typeof parsed.priority === 'string' ? parsed.priority : DEFAULT_FILTERS.priority,
      sort:     typeof parsed.sort     === 'string' ? parsed.sort     : DEFAULT_FILTERS.sort,
    };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

const selectBase =
  'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer';

/**
 * FilterBar – search, status, priority, sort with animated chips showing active filters.
 * Requirements: 13.1–13.7
 */
function FilterBar({ fetchTasks }) {
  const [filters, setFilters] = useState(loadFiltersFromStorage);
  const debounceRef = useRef(null);

  // On mount, call fetchTasks with saved filters
  useEffect(() => {
    fetchTasks(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyChange = (patch) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      fetchTasks(next);
      return next;
    });
  };

  const handleSearchChange = (value) => {
    setFilters((prev) => {
      const next = { ...prev, search: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => { fetchTasks(prev); return prev; });
    }, 400);
  };

  const handleClear = () => {
    setFilters({ ...DEFAULT_FILTERS });
    localStorage.removeItem(STORAGE_KEY);
    fetchTasks();
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search || filters.sort !== 'createdAt_desc';

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 shadow-sm p-4 space-y-3">
      {/* Top row: search + clear */}
      <div className="flex gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔍</span>
          <label htmlFor="filter-search" className="sr-only">Search tasks</label>
          <input
            id="filter-search"
            type="text"
            placeholder="Search tasks…"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-700/60 text-sm text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => { handleSearchChange(''); applyChange({ search: '' }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 px-3 py-2 text-xs font-semibold rounded-lg
                       text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20
                       hover:bg-rose-100 dark:hover:bg-rose-900/40
                       active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 border border-rose-200 dark:border-rose-700/50"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Bottom row: dropdowns */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        <div className="min-w-[130px] flex-1">
          <label htmlFor="filter-status" className="sr-only">Filter by status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => applyChange({ status: e.target.value })}
            className={`${selectBase} ${filters.status ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-300 dark:ring-indigo-500/40' : ''}`}
          >
            <option value="">All statuses</option>
            <option value="todo">📋 To Do</option>
            <option value="in-progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>

        {/* Priority */}
        <div className="min-w-[130px] flex-1">
          <label htmlFor="filter-priority" className="sr-only">Filter by priority</label>
          <select
            id="filter-priority"
            value={filters.priority}
            onChange={(e) => applyChange({ priority: e.target.value })}
            className={`${selectBase} ${filters.priority ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-300 dark:ring-indigo-500/40' : ''}`}
          >
            <option value="">All priorities</option>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>

        {/* Sort */}
        <div className="min-w-[160px] flex-1">
          <label htmlFor="filter-sort" className="sr-only">Sort tasks</label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => applyChange({ sort: e.target.value })}
            className={`${selectBase} ${filters.sort !== 'createdAt_desc' ? 'border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-300 dark:ring-indigo-500/40' : ''}`}
          >
            {SORT_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  fetchTasks: PropTypes.func.isRequired,
};

export default FilterBar;
export { STORAGE_KEY, DEFAULT_FILTERS, loadFiltersFromStorage };
