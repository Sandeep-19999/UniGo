import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDriverNextRoute } from '../../utils/driverOnboarding';

// Validation Functions
const CAMPUS_EMAIL_REGEX = /^[a-zA-Z]+\d+@my\.sliit\.lk$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const VALID_ROLES = ['driver', 'user', 'admin'];

function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length < 3) return 'Name must be at least 3 characters.';
  return '';
}

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) return 'Please select a valid role.';
  return '';
}

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

function validateAdminInviteCode(code, role) {
  if (role === 'admin' && !code.trim()) {
    return 'Admin invite code is required.';
  }
  return '';
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminInviteCode, setAdminInviteCode] = useState('');

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [adminInviteCodeError, setAdminInviteCodeError] = useState('');

  function handleNameChange(e) {
    const value = e.target.value;
    setName(value);
    if (value.trim()) {
      setNameError(validateName(value));
    } else {
      setNameError('');
    }
  }

  function handleRoleChange(e) {
    const value = e.target.value;
    setRole(value);
    setRoleError(validateRole(value));
    // Clear admin code error when role changes
    if (value !== 'admin') {
      setAdminInviteCodeError('');
    }
  }

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

  function handleAdminInviteCodeChange(e) {
    const value = e.target.value;
    setAdminInviteCode(value);
    if (role === 'admin') {
      setAdminInviteCodeError(validateAdminInviteCode(value, role));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');

    // Validate all fields before submit
    const nameErr = validateName(name);
    const roleErr = validateRole(role);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const adminCodeErr = validateAdminInviteCode(adminInviteCode, role);

    setNameError(nameErr);
    setRoleError(roleErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setAdminInviteCodeError(adminCodeErr);

    if (nameErr || roleErr || emailErr || passwordErr || adminCodeErr) {
      return;
    }

    setBusy(true);
    try {
      const { user, onboarding } = await register(name.trim(), email.trim(), password, role, adminInviteCode);
      if (user.role === 'admin') nav('/admin/dashboard');
      else if (user.role === 'driver') nav(getDriverNextRoute(onboarding), { replace: true });
      else nav('/home');
    } catch (e) {
      if (!e?.response) {
        setErr('Cannot connect to server. Start backend and try again.');
      } else {
        setErr(e?.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">Register</h1>
        <p className="mt-1 text-sm text-slate-600">Create an account with a role.</p>

        {err ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block" htmlFor="name">
            <span className="text-sm font-semibold">Name</span>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className={`mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 ${
                nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-slate-900'
              }`}
              value={name}
              onChange={handleNameChange}
              onBlur={() => {
                if (name.trim()) {
                  setNameError(validateName(name));
                }
              }}
              type="text"
              placeholder="Your name"
            />
            {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
          </label>

          <label className="block" htmlFor="role">
            <span className="text-sm font-semibold">Role</span>
            <select
              id="role"
              name="role"
              className={`mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 ${
                roleError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-slate-900'
              }`}
              value={role}
              onChange={handleRoleChange}
            >
              <option value="driver">Driver</option>
              <option value="user">Passenger</option>
              <option value="admin">Admin (invite required)</option>
            </select>
            {roleError ? <p className="mt-1 text-xs text-red-600">{roleError}</p> : null}
          </label>

          {role === 'admin' ? (
            <label className="block" htmlFor="adminInviteCode">
              <span className="text-sm font-semibold">Admin Invite Code</span>
              <input
                id="adminInviteCode"
                name="adminInviteCode"
                className={`mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 ${
                  adminInviteCodeError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-slate-900'
                }`}
                value={adminInviteCode}
                onChange={handleAdminInviteCodeChange}
                onBlur={() => {
                  if (role === 'admin') {
                    setAdminInviteCodeError(validateAdminInviteCode(adminInviteCode, role));
                  }
                }}
                type="text"
                placeholder="From system owner"
              />
              {adminInviteCodeError ? <p className="mt-1 text-xs text-red-600">{adminInviteCodeError}</p> : null}
            </label>
          ) : null}

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
              autoComplete="new-password"
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
              placeholder="Minimum 8 characters"
            />
            {passwordError ? <p className="mt-1 text-xs text-red-600">{passwordError}</p> : null}
          </label>

          <button 
            disabled={busy || nameError || roleError || emailError || passwordError || (role === 'admin' && adminInviteCodeError)}
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-slate-900 underline" to="/auth/login">
            Login
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
