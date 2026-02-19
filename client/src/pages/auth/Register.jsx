import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteCode, setAdminInviteCode] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const u = await register(name, email, password, role, adminInviteCode);
      if (u.role === "admin") nav("/admin/dashboard");
      else if (u.role === "driver") nav("/driver/dashboard");
      else nav("/home");
    } catch (e) {
      setErr(e?.response?.data?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">Register</h1>
        <p className="mt-1 text-sm text-slate-600">Create an account with a role.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block" htmlFor="name">
            <span className="text-sm font-semibold">Name</span>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 focus:ring-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Your name"
              required
            />
          </label>

          <label className="block" htmlFor="role">
            <span className="text-sm font-semibold">Role</span>
            <select
              id="role"
              name="role"
              className="mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 focus:ring-slate-900"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="driver">Driver</option>
              <option value="user">Passenger</option>
              <option value="admin">Admin (invite required)</option>
            </select>
          </label>

          {role === "admin" ? (
            <label className="block" htmlFor="adminInviteCode">
              <span className="text-sm font-semibold">Admin Invite Code</span>
              <input
                id="adminInviteCode"
                name="adminInviteCode"
                className="mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 focus:ring-slate-900"
                value={adminInviteCode}
                onChange={(e) => setAdminInviteCode(e.target.value)}
                type="text"
                placeholder="From system owner"
                required
              />
            </label>
          ) : null}

          <label className="block" htmlFor="email">
            <span className="text-sm font-semibold">Email</span>
            <input
              id="email"
              name="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 focus:ring-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@uni.edu"
              required
            />
          </label>

          <label className="block" htmlFor="password">
            <span className="text-sm font-semibold">Password</span>
            <input
              id="password"
              name="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border p-2 outline-none focus:ring-2 focus:ring-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </label>

          <button
            disabled={busy}
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
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
