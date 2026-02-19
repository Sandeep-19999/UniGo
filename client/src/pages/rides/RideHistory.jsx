import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/axios";
import { fmtDateTime, fmtMoney } from "../../utils/format";

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCompletedRides: 0, items: [] });
  const [err, setErr] = useState("");

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      const [h, e] = await Promise.all([api.get("/driver/rides/history"), api.get("/driver/rides/earnings/summary")]);
      setRides(h.data.rides || []);
      setEarnings(e.data || { totalEarnings: 0, totalCompletedRides: 0, items: [] });
    })().catch((e) => setErr(e?.response?.data?.message || "Failed to load history."));
  }, []);

  const cancelled = useMemo(() => rides.filter((r) => r.status === "cancelled").length, [rides]);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Ride History</h1>
        <p className="text-sm text-slate-600">Completed and cancelled rides with an earnings snapshot.</p>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</div>
          <div className="mt-2 text-2xl font-extrabold">{earnings.totalCompletedRides || 0}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cancelled</div>
          <div className="mt-2 text-2xl font-extrabold">{cancelled}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total earnings</div>
          <div className="mt-2 text-2xl font-extrabold">{fmtMoney(earnings.totalEarnings || 0)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-bold">History list</div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-3 py-2">Departure</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Seats</th>
                <th className="px-3 py-2">Price/seat</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="px-3 py-2">{fmtDateTime(r.departureTime)}</td>
                  <td className="px-3 py-2">{r.origin?.label} → {r.destination?.label}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{String(r.status).toUpperCase()}</span>
                  </td>
                  <td className="px-3 py-2">{r.vehicle?.plateNumber || "-"}</td>
                  <td className="px-3 py-2">{r.availableSeats}/{r.totalSeats}</td>
                  <td className="px-3 py-2">{fmtMoney(r.pricePerSeat)}</td>
                </tr>
              ))}
              {rides.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-slate-500" colSpan={6}>
                    No history yet. Complete or cancel a ride to see it here.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-bold">Earnings breakdown</div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-3 py-2">Departure</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Booked seats</th>
                <th className="px-3 py-2">Price/seat</th>
                <th className="px-3 py-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {(earnings.items || []).map((x) => (
                <tr key={x.rideId} className="border-b">
                  <td className="px-3 py-2">{fmtDateTime(x.departureTime)}</td>
                  <td className="px-3 py-2">{x.from} → {x.to}</td>
                  <td className="px-3 py-2">{x.bookedSeats}</td>
                  <td className="px-3 py-2">{fmtMoney(x.pricePerSeat)}</td>
                  <td className="px-3 py-2 font-semibold">{fmtMoney(x.earnings)}</td>
                </tr>
              ))}
              {(earnings.items || []).length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-slate-500" colSpan={5}>No completed rides yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
