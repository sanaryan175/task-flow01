import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

function AuthInput({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/60
                   text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm placeholder-gray-400
                   transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

AuthInput.propTypes = {
  id: PropTypes.string.isRequired, label: PropTypes.string.isRequired,
  type: PropTypes.string, value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired, placeholder: PropTypes.string,
  autoComplete: PropTypes.string,
};

/**
 * Login page — shown when user is not authenticated.
 * @param {{ onSwitch: () => void }} props
 */
function Login({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-extrabold gradient-text">TaskFlow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/40 border border-gray-100 dark:border-gray-700/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput id="login-email" label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            <AuthInput id="login-password" label="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />

            {error && (
              <p className="text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-indigo-500 to-purple-600
                         hover:from-indigo-600 hover:to-purple-700
                         active:scale-[0.98] transition-all
                         focus:outline-none focus:ring-2 focus:ring-indigo-500
                         disabled:opacity-60 disabled:cursor-not-allowed
                         shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitch}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = { onSwitch: PropTypes.func.isRequired };
export default Login;
