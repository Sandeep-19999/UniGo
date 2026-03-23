import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as bookingService from "../../../api/bookingService";

export default function DriverDetails() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDriverDetails();
  }, [driverId]);

  const loadDriverDetails = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getDriverDetails(driverId);
      setDriver(data.driver);
      setVehicles(data.vehicles || []);
      setRides(data.upcomingRides || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load driver details");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRide = (rideId) => {
    navigate(`/browse/rides/${rideId}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <button
          onClick={() => navigate("/browse/drivers")}
          className="text-blue-600 hover:underline text-sm mb-4"
        >
          ← Back to Drivers
        </button>
        <div className="mt-6 text-center text-slate-600">
          Loading driver details...
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <button
          onClick={() => navigate("/browse/drivers")}
          className="text-blue-600 hover:underline text-sm mb-4"
        >
          ← Back to Drivers
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Driver not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <button
        onClick={() => navigate("/browse/drivers")}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Back to Drivers
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Driver Info */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {driver.name}
        </h1>
        <p className="text-slate-600 mt-2">{driver.email}</p>
      </div>

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Vehicles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold capitalize text-slate-900">
                      {vehicle.type}
                    </p>
                    <p className="text-sm text-slate-600">
                      {vehicle.plateNumber}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Capacity: {vehicle.seatCapacity} seats
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Rides */}
      {rides.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Rides</h2>
          <div className="grid gap-4">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      From
                    </p>
                    <p className="font-semibold text-slate-900">
                      {ride.origin.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      To
                    </p>
                    <p className="font-semibold text-slate-900">
                      {ride.destination.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      Departure
                    </p>
                    <p className="text-sm text-slate-900">
                      {new Date(ride.departureTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(ride.departureTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      Seats Available
                    </p>
                    <p className="font-bold text-blue-600">
                      {ride.availableSeats}/{ride.totalSeats}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleViewRide(ride._id)}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    View & Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rides.length === 0 && (
        <div className="rounded-2xl border bg-white p-6 text-center text-slate-600">
          No upcoming rides available from this driver
        </div>
      )}
    </div>
  );
}
