import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-600">You don’t have permission to access that page.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Go to Landing</Link>
          <Link to="/auth/login" className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-800">Login</Link>
        </div>
      </div>
    </div>
  );
}
