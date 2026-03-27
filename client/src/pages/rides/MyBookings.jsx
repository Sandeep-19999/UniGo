import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const watchIdRef = useRef(null);

  useEffect(() => {
    let active = true;

    const fetchBookings = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const { data } = await api.get("/passenger/rides");
        if (active) setBookings(data.rideRequests || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load bookings");
      } finally {
        if (!silent && active) setLoading(false);
      }
    };

    fetchBookings();
    const timer = setInterval(() => fetchBookings(true), 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const activePassengerRide = bookings.find((booking) => ["pending", "accepted", "started"].includes(booking.status));

  useEffect(() => {
    if (!activePassengerRide || !navigator.geolocation) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        api.patch(`/passenger/rides/${activePassengerRide._id}/location`, {
          currentLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }).catch(() => {});
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activePassengerRide?._id]);

  const handleCancel = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await api.put(`/passenger/rides/${bookingId}/cancel`);
        setBookings((current) => current.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b)));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to cancel booking");
      }
    }
  };

  const handleRateDriver = (bookingId) => {
    navigate(`/rides/rate/${bookingId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "started":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeatPreferenceLabel = (numberOfSeats) => {
    const parsedSeats = Number(numberOfSeats);
    if (parsedSeats === 0) return "Any";
    if ([1, 2, 3].includes(parsedSeats)) return `${parsedSeats}+`;
    return "N/A";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your ride requests</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {activePassengerRide ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Live passenger location sharing is active for your current ride so the driver can see you on the map.
          </div>
        ) : null}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600">You haven't made any ride requests yet. Start by searching for a ride!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">From: {booking.pickupLocation}</h3>
                        <span className="text-gray-400">→</span>
                        <h3 className="text-lg font-bold text-gray-800">To: {booking.dropLocation}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {new Date(booking.createdAt).toLocaleDateString()} at{" "}
                        {new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Vehicle Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{booking.vehicleType || "Any"}</p>
                      <p className="text-xs text-gray-600 mt-2">Distance: {Number(booking.distanceKm || 0).toFixed(2)} km</p>
                      <p className="text-xs text-gray-600">Time: {Math.round(Number(booking.timeMin || 0))} min</p>
                      <p className="text-xs text-gray-700 font-semibold">Fare: Rs. {Number(booking.finalFare ?? booking.estimatedFare ?? booking.estimatedPrice ?? 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Seats</p>
                      <p className="font-semibold text-gray-800">{getSeatPreferenceLabel(booking.numberOfSeats)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                      <p className="font-semibold text-gray-800 capitalize">{booking.paymentMethod || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Driver</p>
                      <p className="font-semibold text-gray-800">{booking.acceptedBy?.name || "Waiting for driver..."}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Request ID</p>
                      <p className="font-semibold text-gray-800 text-xs">{booking._id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                      <p className="text-gray-600 text-sm">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {booking.status !== "completed" && booking.status !== "cancelled" && (
                      <>
                        <button className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">Contact Driver</button>
                        <button onClick={() => handleCancel(booking._id)} className="flex-1 bg-red-100 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-200 transition">Cancel Request</button>
                      </>
                    )}
                    {booking.status === "completed" && (
                      <button onClick={() => handleRateDriver(booking._id)} className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition">⭐ Rate Driver</button>
                    )}
                    {booking.status === "cancelled" && (
                      <button className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg cursor-not-allowed">Request Cancelled</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}