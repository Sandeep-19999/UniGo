import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

// Validation Functions
const CAMPUS_EMAIL_REGEX = /^[a-zA-Z]+\d+@my\.sliit\.lk$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (!CAMPUS_EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid SLIIT campus email (e.g., IT23822222@my.sliit.lk)';
  }
  return '';
}

function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special character (@$!%*?&).';
  }
  return '';
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const from = location.state?.from;

  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);
    if (value.trim()) {
      setEmailError(validateEmail(value));
    } else {
      setEmailError('');
    }
  }

  function handlePasswordChange(e) {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setPasswordError(validatePassword(value));
    } else {
      setPasswordError('');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    // Validate before submit
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      return;
    }

    setBusy(true);
    try {
      const { user, onboarding } = await login(email.trim(), password);
      if (from) return nav(from, { replace: true });

      if (user.role === 'admin') nav('/admin/dashboard');
      else if (user.role === 'driver') nav(getDriverNextRoute(onboarding), { replace: true });
      else nav('/home');
    } catch (e) {
      if (!e?.response) {
        setErr('Cannot connect to server. Start backend and try again.');
      } else {
        setErr(e?.response?.data?.message || 'Login failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in as Admin, Driver, or Passenger.</p>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block" htmlFor="email">
            <span className="text-sm font-semibold">Email</span>
            <input
              id="email"
              name="email"
              autoComplete="email"
              className={`mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 ${
                emailError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-slate-900'
              }`}
              value={email}
              onChange={handleEmailChange}
              onBlur={() => {
                if (email.trim()) {
                  setEmailError(validateEmail(email));
                }
              }}
              type="email"
              placeholder="you@uni.edu"
            />
            {emailError ? <p className="mt-1 text-xs text-red-600">{emailError}</p> : null}
          </label>

          <label className="block" htmlFor="password">
            <span className="text-sm font-semibold">Password</span>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              className={`mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 ${
                passwordError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-slate-900'
              }`}
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => {
                if (password) {
                  setPasswordError(validatePassword(password));
                }
              }}
              type="password"
              placeholder="••••••••"
            />
            {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
          </label>

          <button disabled={busy || emailError || passwordError} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          No account?{' '}
          <Link className="font-semibold text-slate-900 underline" to="/auth/register">
            Register
          </Link>
        </div>

        <div className="mt-4 text-sm">
          <Link className="text-slate-700 underline" to="/">
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
