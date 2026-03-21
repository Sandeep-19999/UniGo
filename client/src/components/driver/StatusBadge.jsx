const STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  ongoing: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200"
};

export default function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  const tone = STYLES[key] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}>
      {key ? key.toUpperCase() : "UNKNOWN"}
    </span>
  );
}