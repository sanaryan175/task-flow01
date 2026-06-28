import { createContext, useCallback, useContext, useState } from 'react';

// Feature: task-manager-app, Property 18: Toast Queue Max-5 Invariant
const MAX_TOASTS = 5;

const ToastContext = createContext(null);

/**
 * Provides toast notification state and helpers to the component tree.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new notification. Oldest entry is dropped when the queue exceeds MAX_TOASTS.
   * @param {string} message
   * @param {'success'|'error'} [type='success']
   */
  const showToast = useCallback((message, type = 'success') => {
    setToasts((prev) => {
      const next = [{ id: Date.now(), message, type }, ...prev];
      return next.length > MAX_TOASTS ? next.slice(0, MAX_TOASTS) : next;
    });
  }, []);

  /**
   * Remove the notification with the given id.
   * @param {number} id
   */
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Returns the current toast context value.
 * Must be used inside a <ToastProvider>.
 * @returns {{ toasts: Array<{id: number, message: string, type: string}>, showToast: Function, dismissToast: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
