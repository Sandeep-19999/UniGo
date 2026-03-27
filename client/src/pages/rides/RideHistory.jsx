import { useEffect, useMemo, useRef, useState } from "react";
import DriverLayout from "../../components/driver/DriverLayout";
import StatusBadge from "../../components/driver/StatusBadge";
import { api } from "../../api/axios";
import { fmtMoney } from "../../utils/format";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [err, setErr] = useState("");

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      const { data } = await api.get("/driver/requests/accepted");
      setRides(data.rideRequests || []);
    })().catch((error) => setErr(error?.response?.data?.message || "Failed to load ride history."));
  }, []);

  const completedRides = useMemo(() => rides.filter((ride) => ride.status === "completed"), [rides]);
  const cancelledRides = useMemo(() => rides.filter((ride) => ride.status === "cancelled"), [rides]);
  const visibleRides = useMemo(
    () => rides.filter((ride) => ["completed", "cancelled"].includes(ride.status)),
    [rides]
  );

  const totalEarnings = completedRides.reduce(
    (sum, ride) => sum + Number(ride.estimatedFare ?? ride.estimatedPrice ?? 0),
    0
  );

  return (
    <DriverLayout
      title="Ride History"
      subtitle="Completed and cancelled ride requests handled through the new dashboard-based matching flow."
    >
      {err ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Completed</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{completedRides.length}</div>
          <div className="mt-2 text-sm text-slate-500">Successfully completed passenger rides.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cancelled</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{cancelledRides.length}</div>
          <div className="mt-2 text-sm text-slate-500">Cancelled rides recorded for this driver.</div>
        </div>
        <div className="driver-kpi">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Estimated earnings</div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{fmtMoney(totalEarnings)}</div>
          <div className="mt-2 text-sm text-slate-500">Calculated from completed matched ride requests.</div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <section className="driver-table-wrap">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="text-xl font-bold text-slate-950">Ride request history</div>
            <div className="mt-1 text-sm text-slate-500">Trips completed or cancelled through the live matching dashboard.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="driver-table">
              <thead>
                <tr>
                  <th>Accepted at</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Fare</th>
                </tr>
              </thead>
              <tbody>
                {visibleRides.map((ride) => (
                  <tr key={ride._id} className="border-t border-slate-100">
                    <td>{formatDateTime(ride.acceptedAt || ride.createdAt)}</td>
                    <td>{ride.passenger?.name || "Passenger"}</td>
                    <td>
                      <div>{ride.pickupLocation}</div>
                      <div className="text-xs text-slate-500">to {ride.dropLocation}</div>
                    </td>
                    <td>
                      <StatusBadge status={ride.status} />
                    </td>
                    <td className="capitalize">{String(ride.driverJourneyStep || "-").replace(/_/g, " ")}</td>
                    <td>{fmtMoney(ride.estimatedFare ?? ride.estimatedPrice ?? 0)}</td>
                  </tr>
                ))}

                {visibleRides.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                      No completed or cancelled ride requests yet.
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