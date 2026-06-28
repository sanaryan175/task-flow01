// Feature: task-manager-app
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
