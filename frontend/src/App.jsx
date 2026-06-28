// Feature: task-manager-app
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  // Still resolving saved session — show nothing to avoid flash
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl animate-pulse shadow-lg">
            ✓
          </div>
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showSignup
      ? <Signup onSwitch={() => setShowSignup(false)} />
      : <Login  onSwitch={() => setShowSignup(true)} />;
  }

  return <Home />;
}

export default App;
