import { useEffect, useMemo, useRef, useState } from "react";
import StatCard from "../../../components/StatCard";
import { api } from "../../../api/axios";
import { fmtMoney } from "../../../utils/format";

export default function DriverDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCompletedRides: 0 });

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const controller = new AbortController();

    (async () => {
      const [v, r, e] = await Promise.all([
        api.get("/driver/vehicles", { signal: controller.signal }),
        api.get("/driver/rides", { signal: controller.signal }),
        api.get("/driver/rides/earnings/summary", { signal: controller.signal })
      ]);

      setVehicles(v.data.vehicles || []);
      setRides(r.data.rides || []);
      setEarnings(e.data || { totalEarnings: 0, totalCompletedRides: 0 });
    })().catch(() => {});

    return () => controller.abort();
  }, []);

  const activeRides = useMemo(() => rides.filter((x) => ["pending", "ongoing"].includes(x.status)).length, [rides]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Driver Dashboard</h1>
        <p className="text-sm text-slate-600">Operational overview (role-gated).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Vehicles" value={vehicles.length} hint="Registered" />
        <StatCard label="Active rides" value={activeRides} hint="Pending/Ongoing" />
        <StatCard
          label="Total earnings"
          value={fmtMoney(earnings.totalEarnings || 0)}
          hint={`${earnings.totalCompletedRides || 0} completed rides`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-bold">Next rides (soonest)</div>
          <div className="mt-3 space-y-3">
            {rides
              .slice()
              .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
              .slice(0, 5)
              .map((r) => (
                <div key={r._id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">
                      {r.origin?.label} → {r.destination?.label}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {String(r.status).toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Departs: {new Date(r.departureTime).toLocaleString()} • Seats: {r.availableSeats}/{r.totalSeats}
                  </div>
                </div>
              ))}
            {rides.length === 0 ? <div className="text-sm text-slate-500">No rides yet.</div> : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-bold">Policy reminders</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Seats validated by type (Bike=1, Car≤4, Van≥8, Mini Van 6–20).</li>
            <li>Edit rides only before departure and while Pending.</li>
            <li>Vehicle deletion blocked if it has Pending/Ongoing ride.</li>
            <li>Booking seats reduces availability.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
