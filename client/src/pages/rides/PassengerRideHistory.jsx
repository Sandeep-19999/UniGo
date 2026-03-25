import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";

export default function PassengerRideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchRideHistory = async () => {
      try {
        const response = await api.get("/passenger/rides");
        const allRides = response.data.rideRequests || [];

        // Filter: Only completed rides from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const completedRides = allRides.filter((ride) => {
          const rideDate = new Date(ride.createdAt);
          // Include rides with status: completed, finished, or those without status but have acceptedBy (indicating completed)
          const isCompleted = 
            ride.status === "completed" || 
            ride.status === "finished" || 
            (ride.acceptedBy && ride.status !== "pending" && ride.status !== "active");
          return isCompleted && rideDate >= sevenDaysAgo;
        });

        // Sort by date descending (newest first)
        completedRides.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setRides(completedRides);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load ride history");
        console.error("Error fetching ride history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRideHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const formatDateShort = (date) => {
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };

    return `${formatDateShort(sevenDaysAgo)} – Today`;
  };

  const groupRidesByDate = () => {
    const grouped = {};
    rides.forEach((ride) => {
      const dateKey = formatDate(ride.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(ride);
    });
    return grouped;
  };

  const groupedRides = groupRidesByDate();

  return (
    <div className="unigo-shell min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Ride History</h1>
            <p className="mt-1 text-slate-600">Your rides from the past 7 days</p>
          </div>
          <div className="rounded-lg bg-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-600">
              {rides.length} {rides.length === 1 ? "ride" : "rides"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {err}
          </div>
        ) : null}

        {/* Date Range Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-900">
            📅 Showing bookings from the past 7 days ({formatDateRange()})
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="rounded-lg bg-slate-50 px-6 py-12 text-center">
            <p className="text-slate-600">Loading ride history...</p>
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-6 py-12 text-center">
            <p className="text-slate-600">No completed rides in the past 7 days</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRides).map(([date, dayRides]) => (
              <div key={date}>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">{date}</h2>
                <div className="space-y-3">
                  {dayRides.map((ride) => (
                    <div
                      key={ride._id}
                      className="border-l-4 border-orange-500 rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Route & Driver Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {ride.pickupLocation} → {ride.dropLocation}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Driver: <span className="font-medium">{ride.acceptedBy?.name || "N/A"}</span> • Rs.{" "}
                            <span className="font-medium">{ride.estimatedPrice || "0"}</span> • {ride.numberOfSeats || "1"}{" "}
                            seat{ride.numberOfSeats !== 1 ? "s" : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            <span>🕐 {formatTime(ride.createdAt)}</span>
                            <span>💳 {ride.paymentMethod || "N/A"}</span>
                            <span>✓ Booked {new Date(ride.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
                            {ride.status}
                          </span>
                          <Link
                            to={`/rides/rate/${ride._id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <Link
            to="/home"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
