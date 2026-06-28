import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useToast } from '../context/ToastContext';

const AUTO_DISMISS_MS = 3000;

const TYPE_CONFIG = {
  success: {
    bg:   'bg-emerald-500 hover:bg-emerald-600',
    icon: '✅',
    bar:  'bg-emerald-300',
  },
  error: {
    bg:   'bg-rose-500 hover:bg-rose-600',
    icon: '⚠️',
    bar:  'bg-rose-300',
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.success;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl text-white text-sm
                  cursor-pointer select-none max-w-sm w-full overflow-hidden
                  ${cfg.bg} transition-colors animate-slide-in`}
      onClick={() => onDismiss(toast.id)}
    >
      {/* Progress bar that drains over AUTO_DISMISS_MS */}
      <span
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} rounded-full`}
        style={{ animation: `shrink-width ${AUTO_DISMISS_MS}ms linear forwards` }}
        aria-hidden="true"
      />

      <span className="text-base shrink-0">{cfg.icon}</span>
      <span className="flex-1 break-words leading-snug">{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="shrink-0 text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white/50 rounded"
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
      >
        ✕
      </button>
    </div>
  );
}

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id:      PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    type:    PropTypes.string.isRequired,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

/**
 * Toast container – fixed top-right, newest on top, slides in from the right.
 * Requirements: 14.3, 14.4, 14.5, 20.1
 */
function Toast() {
  const { toasts, dismissToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div aria-label="Notifications" className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

export default Toast;
