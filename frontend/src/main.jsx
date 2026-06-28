// Feature: task-manager-app
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import App from './App';

// Global styles (Tailwind base)
import './index.css';

/**
 * Application entry point.
 *
 * Wraps <App /> with <ToastProvider> so that any component in the tree can
 * call `useToast()` to emit notifications.
 *
 * Requirements: 15.1, 20.3
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
