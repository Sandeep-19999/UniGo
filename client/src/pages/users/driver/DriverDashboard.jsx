import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DriverLayout from "../../../components/driver/DriverLayout";
import StatusBadge from "../../../components/driver/StatusBadge";
import LiveDriverMap from "../../../components/driver/LiveDriverMap";
import { api } from "../../../api/axios";

function formatMoney(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DriverDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    totalCompletedRides: 0,
  });

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const controller = new AbortController();

    (async () => {
      const [v, r, e] = await Promise.all([
        api.get("/driver/vehicles", { signal: controller.signal }),
        api.get("/driver/rides", { signal: controller.signal }),
        api.get("/driver/rides/earnings/summary", { signal: controller.signal }),
      ]);

      setVehicles(v.data.vehicles || []);
      setRides(r.data.rides || []);
      setEarnings(e.data || { totalEarnings: 0, totalCompletedRides: 0 });
    })().catch(() => {});

    return () => controller.abort();
  }, []);

  const activeRides = useMemo(
    () => rides.filter((ride) => ["pending", "ongoing"].includes(ride.status)).length,
    [rides]
  );

  const upcomingRides = useMemo(() => {
    return rides
      .filter((ride) => ["pending", "ongoing"].includes(ride.status))
      .slice()
      .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
      .slice(0, 4);
  }, [rides]);

  return (
    <DriverLayout
      title="Driver Dashboard"
      subtitle="Clean live-location dashboard for your daily ride activity."
      actions={
        <>
          <Link to="/driver/rides" className="driver-btn-secondary">
            Manage rides
          </Link>
          <Link to="/driver/vehicles" className="driver-btn-primary">
            Manage vehicles
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <LiveDriverMap
          driverName="Driver"
          earningsTotal={earnings.totalEarnings || 0}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="driver-kpi">
            <div className="driver-kpi-label">Vehicles</div>
            <div className="driver-kpi-value">{vehicles.length}</div>
            <div className="driver-kpi-hint">Your registered vehicles</div>
          </div>

          <div className="driver-kpi">
            <div className="driver-kpi-label">Active rides</div>
            <div className="driver-kpi-value">{activeRides}</div>
            <div className="driver-kpi-hint">Pending and ongoing</div>
          </div>

          <div className="driver-kpi">
            <div className="driver-kpi-label">Completed earnings</div>
            <div className="driver-kpi-value">{formatMoney(earnings.totalEarnings || 0)}</div>
            <div className="driver-kpi-hint">
              {earnings.totalCompletedRides || 0} completed rides
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
          <section className="driver-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Upcoming rides</h2>
                <p className="text-sm text-slate-500">
                  Your nearest scheduled rides
                </p>
              </div>
              <Link to="/driver/history" className="driver-btn-secondary">
                View history
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingRides.length > 0 ? (
                upcomingRides.map((ride) => (
                  <div key={ride._id} className="rounded-[24px] border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-bold text-slate-950">
                          {ride.origin?.label} → {ride.destination?.label}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {new Date(ride.departureTime).toLocaleString()}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            Seats {ride.availableSeats}/{ride.totalSeats}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                            Vehicle {ride.vehicle?.plateNumber || "-"}
                          </span>
                        </div>
                      </div>

                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No active rides yet.
                </div>
              )}
            </div>
          </section>

          <section className="driver-card p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-950">Quick actions</h2>
              <p className="text-sm text-slate-500">
                Simple shortcuts for daily driver tasks
              </p>
            </div>

            <div className="grid gap-3">
              <Link to="/driver/rides" className="driver-btn-secondary justify-between">
                <span>Create or edit rides</span>
                <span>→</span>
              </Link>

              <Link to="/driver/vehicles" className="driver-btn-secondary justify-between">
                <span>Manage vehicle list</span>
                <span>→</span>
              </Link>

              <Link to="/driver/history" className="driver-btn-secondary justify-between">
                <span>Check ride history</span>
                <span>→</span>
              </Link>

              <Link to="/driver/directional-hire" className="driver-btn-primary justify-between">
                <span>Open directional hire</span>
                <span>→</span>
              </Link>
            </div>

            <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-800">Small note</div>
              <div className="mt-1 text-sm text-slate-500">
                This map is now live because it watches your position continuously.
              </div>
            </div>
          </section>
        </div>
      </div>
    </DriverLayout>
  );
}