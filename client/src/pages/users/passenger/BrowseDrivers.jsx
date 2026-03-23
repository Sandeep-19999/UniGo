import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as bookingService from "../../../api/bookingService";

export default function BrowseDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const { drivers } = await bookingService.listAvailableDrivers();
      setDrivers(drivers || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (driverId) => {
    navigate(`/browse/drivers/${driverId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-extrabold">Browse Drivers</h1>
        <div className="mt-6 text-center text-slate-600">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Browse Drivers</h1>
        <p className="text-sm text-slate-600 mt-2">
          Find a driver and book your ride
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-slate-600">No drivers available at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <div
              key={driver._id}
              className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {driver.name}
                  </h2>
                  <p className="text-sm text-slate-600">{driver.email}</p>
                </div>

                <button
                  onClick={() => handleViewDetails(driver._id)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  View Details & Rides
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
