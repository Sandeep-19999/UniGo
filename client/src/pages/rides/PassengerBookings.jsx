import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as bookingService from "../../api/bookingService";

export default function PassengerBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(
    location.state?.success || ""
  );

  useEffect(() => {
    if (successMsg) {
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }, [successMsg]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { bookings } = await bookingService.listMyBookings();
      setBookings(bookings || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await bookingService.cancelBooking(bookingId);
        loadBookings();
        setSuccessMsg("Booking cancelled successfully");
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to cancel booking"
        );
      }
    }
  };

  const handleRateRide = (bookingId, ride, driverId) => {
    navigate(`/rate-ride/${bookingId}`, {
      state: { ride, driverId },
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRideStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-extrabold">My Bookings</h1>
        <div className="mt-6 text-center text-slate-600">
          Loading bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">My Bookings</h1>
        <p className="text-sm text-slate-600 mt-2">
          View and manage your ride bookings
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-slate-600 mb-4">No bookings yet</p>
          <button
            onClick={() => navigate("/browse/rides")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Search for Rides
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    From
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {booking.ride.origin.label}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    To
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {booking.ride.destination.label}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Date & Time
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {new Date(
                      booking.ride.departureTime
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(booking.ride.departureTime).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Seats Booked
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {booking.seatsBooked}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    Total Price
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    Rs.{booking.totalPrice}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                      booking.status
                    )}`}
                  >
                    Booking: {booking.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getRideStatusBadgeColor(
                      booking.ride.status
                    )}`}
                  >
                    Ride: {booking.ride.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  {booking.status === "pending" && (
                    <button
                      onClick={() =>
                        handleCancelBooking(booking._id)
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {booking.ride.status === "completed" && (
                    <button
                      onClick={() =>
                        handleRateRide(
                          booking._id,
                          booking.ride,
                          booking.ride.driver._id
                        )
                      }
                      className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
                    >
                      Rate Driver
                    </button>
                  )}

                  <button
                    onClick={() =>
                      navigate(`/booking/${booking._id}`)
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-xs font-medium text-slate-600 uppercase mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-700">{booking.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
