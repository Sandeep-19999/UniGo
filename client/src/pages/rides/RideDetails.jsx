import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as bookingService from "../../api/bookingService";

export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [seatsBooked, setSeatsBooked] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      const ride = await bookingService.getRideDetails(rideId);
      setRide(ride);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load ride details");
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    try {
      setBookingLoading(true);
      await bookingService.createBooking(
        rideId,
        seatsBooked,
        paymentMethod,
        notes
      );
      navigate("/bookings", {
        state: { success: "Ride booked successfully!" },
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to book ride");
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => navigate("/browse/rides")}
          className="text-blue-600 hover:underline text-sm mb-4"
        >
          ← Back to Rides
        </button>
        <div className="mt-6 text-center text-slate-600">
          Loading ride details...
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => navigate("/browse/rides")}
          className="text-blue-600 hover:underline text-sm mb-4"
        >
          ← Back to Rides
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Ride not found
        </div>
      </div>
    );
  }

  const totalPrice = seatsBooked * ride.pricePerSeat;
  const canBook = ride.availableSeats >= seatsBooked && user?.role === "user";

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <button
        onClick={() => navigate("/browse/rides")}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Back to Rides
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ride Info */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">From</p>
            <p className="text-2xl font-bold text-slate-900">
              {ride.origin.label}
            </p>
          </div>

          <div className="flex items-center justify-center text-slate-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">To</p>
            <p className="text-2xl font-bold text-slate-900">
              {ride.destination.label}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Departure
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {new Date(ride.departureTime).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-600">
              {new Date(ride.departureTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Available Seats
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {ride.availableSeats}
            </p>
            <p className="text-xs text-slate-600">of {ride.totalSeats} total</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Price/Seat
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              Rs.{ride.pricePerSeat}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Vehicle
            </p>
            <p className="text-sm font-semibold capitalize text-slate-900 mt-1">
              {ride.vehicle.type}
            </p>
            <p className="text-xs text-slate-600">{ride.vehicle.plateNumber}</p>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Driver Information</h3>
        <div className="space-y-2">
          <p className="text-slate-900">
            <span className="text-slate-600">Name:</span>{" "}
            <span className="font-semibold">{ride.driver.name}</span>
          </p>
          <p className="text-slate-900">
            <span className="text-slate-600">Email:</span>{" "}
            <span className="font-semibold">{ride.driver.email}</span>
          </p>
        </div>
      </div>

      {/* Booking Form */}
      {!user || user.role === "user" ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Book Your Seat</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Seats
              </label>
              <input
                type="number"
                min="1"
                max={ride.availableSeats}
                value={seatsBooked}
                onChange={(e) => setSeatsBooked(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {seatsBooked > ride.availableSeats && (
                <p className="text-xs text-red-600 mt-1">
                  Only {ride.availableSeats} seats available
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="cash">Cash</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or messages for the driver..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows="3"
              />
            </div>

            {/* Price Summary */}
            <div className="rounded-lg bg-slate-50 p-4 space-y-2 border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Price per seat:</span>
                <span className="font-medium">Rs.{ride.pricePerSeat}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Number of seats:</span>
                <span className="font-medium">{seatsBooked}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span>Total Price:</span>
                <span className="text-green-600">Rs.{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleBookRide}
              disabled={
                bookingLoading ||
                !canBook ||
                seatsBooked > ride.availableSeats
              }
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              {bookingLoading ? "Processing..." : "Confirm Booking"}
            </button>

            {!user && (
              <p className="text-center text-sm text-slate-600">
                Please{" "}
                <button
                  onClick={() => navigate("/auth/login")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  log in
                </button>{" "}
                to book a ride
              </p>
            )}

            {user && user.role !== "user" && (
              <p className="text-center text-sm text-red-600">
                Only passengers (users) can book rides
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center text-yellow-800">
          <p>Only passengers can book rides. Please log in as a passenger.</p>
        </div>
      )}
    </div>
  );
}
