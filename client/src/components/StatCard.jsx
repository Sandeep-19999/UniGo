export default function StatCard({ label, value, hint }) {
  return (
    <div className="driver-kpi relative overflow-hidden">
      <div className="absolute right-5 top-5 h-12 w-12 rounded-2xl bg-emerald-50" />
      <div className="relative">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
        <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</div>
        {hint ? <div className="mt-2 text-sm text-slate-500">{hint}</div> : null}
      </div>
    </div>
  );
}