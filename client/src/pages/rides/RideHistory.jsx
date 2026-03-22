import { useEffect, useMemo, useRef, useState } from "react";
import DriverLayout from "../../components/driver/DriverLayout";
import StatusBadge from "../../components/driver/StatusBadge";
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
      const [h, e] = await Promise.all([
        api.get("/driver/rides/history"),
        api.get("/driver/rides/earnings/summary")
      ]);
      setRides(h.data.rides || []);
      setEarnings(e.data || { totalEarnings: 0, totalCompletedRides: 0, items: [] });
    })().catch((e) => setErr(e?.response?.data?.message || "Failed to load history."));
  }, []);

  const cancelled = useMemo(() => rides.filter((ride) => ride.status === "cancelled").length, [rides]);

  return (
    <DriverLayout
      title="Ride History"
      subtitle="Completed and cancelled rides with a more dashboard-style presentation and the same backend data."
    >
      {err ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Completed</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{earnings.totalCompletedRides || 0}</div>
          <div className="mt-2 text-sm text-slate-500">Successfully completed rides.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cancelled</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{cancelled}</div>
          <div className="mt-2 text-sm text-slate-500">Cancelled rides in your history.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total earnings</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{fmtMoney(earnings.totalEarnings || 0)}</div>
          <div className="mt-2 text-sm text-slate-500">Pulled from the existing summary endpoint.</div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section className="driver-table-wrap">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="text-xl font-bold text-slate-950">History list</div>
            <div className="mt-1 text-sm text-slate-500">Completed and cancelled ride records.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Departure</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Vehicle</th>
                  <th>Seats</th>
                  <th>Price/seat</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((ride) => (
                  <tr key={ride._id} className="border-t border-slate-100">
                    <td>{fmtDateTime(ride.departureTime)}</td>
                    <td>{ride.origin?.label} → {ride.destination?.label}</td>
                    <td>
                      <StatusBadge status={ride.status} />
                    </td>
                    <td>{ride.vehicle?.plateNumber || "-"}</td>
                    <td>{ride.availableSeats}/{ride.totalSeats}</td>
                    <td>{fmtMoney(ride.pricePerSeat)}</td>
                  </tr>
                ))}

                {rides.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      No history yet. Complete or cancel a ride to see it here.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="driver-table-wrap">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="text-xl font-bold text-slate-950">Earnings breakdown</div>
            <div className="mt-1 text-sm text-slate-500">Calculated rows from your current earnings summary response.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Departure</th>
                  <th>Route</th>
                  <th>Booked seats</th>
                  <th>Price/seat</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {(earnings.items || []).map((item) => (
                  <tr key={item.rideId} className="border-t border-slate-100">
                    <td>{fmtDateTime(item.departureTime)}</td>
                    <td>{item.from} → {item.to}</td>
                    <td>{item.bookedSeats}</td>
                    <td>{fmtMoney(item.pricePerSeat)}</td>
                    <td className="font-semibold text-slate-950">{fmtMoney(item.earnings)}</td>
                  </tr>
                ))}

                {(earnings.items || []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      No completed rides yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DriverLayout>
  );
}