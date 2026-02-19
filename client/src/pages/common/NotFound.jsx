import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">404</h1>
        <p className="mt-2 text-sm text-slate-600">Page not found.</p>
        <div className="mt-4"><Link to="/" className="underline">Back to landing</Link></div>
      </div>
    </div>
  );
}
