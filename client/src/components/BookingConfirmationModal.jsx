import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function BookingConfirmationModal({ ride, isOpen, onClose, onBookingSuccess }) {
  const navigate = useNavigate();
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seatErrors, setSeatErrors] = useState("");

  if (!isOpen || !ride) return null;

  const totalPrice = ride.pricePerSeat * seatsToBook;
  const maxSeats = ride.availableSeats || 0;

  const handleSeatsChange = (newValue) => {
    setSeatErrors("");
    
    // Validate input
    if (!Number.isInteger(newValue)) {
      setSeatErrors("Seats must be a whole number");
      return;
    }

    if (newValue < 1) {
      setSeatErrors("Minimum 1 seat required");
      setSeatsToBook(1);
      return;
    }

    if (newValue > maxSeats) {
      setSeatErrors(`Maximum ${maxSeats} seats available`);
      setSeatsToBook(maxSeats);
      return;
    }

    setSeatsToBook(newValue);
  };

  const incrementSeats = () => {
    if (seatsToBook < maxSeats) {
      setSeatsToBook(seatsToBook + 1);
      setSeatErrors("");
    } else {
      setSeatErrors(`Maximum ${maxSeats} seats available`);
    }
  };

  const decrementSeats = () => {
    if (seatsToBook > 1) {
      setSeatsToBook(seatsToBook - 1);
      setSeatErrors("");
    } else {
      setSeatErrors("Minimum 1 seat required");
    }
  };

  const handleBooking = async () => {
    setSeatErrors("");
    setError("");

    // Final validation
    if (!seatsToBook || seatsToBook < 1) {
      setSeatErrors("Select at least 1 seat");
      return;
    }

    if (seatsToBook > maxSeats) {
      setSeatErrors(`Cannot book more than ${maxSeats} seats`);
      return;
    }

    if (!ride._id) {
      setError("Invalid ride ID");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/passenger/bookings", {
        rideId: ride._id,
        seatsBooked: seatsToBook,
        notes: notes.trim() || ""
      });

      // Success callback
      if (onBookingSuccess) {
        onBookingSuccess(data.booking);
      }

      // Redirect to payment
      setTimeout(() => {
        navigate("/payments", {
          state: {
            booking: data.booking,
            totalPrice: data.booking.totalPrice
          }
        });
      }, 1000);

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white sticky top-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Confirm Booking</h2>
              <p className="text-blue-100 text-sm mt-1">Review and confirm your ride</p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-800 font-medium text-sm">❌ {error}</p>
            </div>
          )}

          {/* Route Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Trip Details</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">From</p>
                  <p className="font-semibold text-gray-900">{ride.origin?.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <span className="flex-1 h-0.5 bg-gray-300"></span>
                <span className="text-xs">Route</span>
                <span className="flex-1 h-0.5 bg-gray-300"></span>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">To</p>
                  <p className="font-semibold text-gray-900">{ride.destination?.label}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Departure</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(ride.departureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                  <p className="font-semibold text-gray-900 capitalize">{ride.vehicle?.type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seats Selection */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-gray-900 text-lg">
                Select Seats 🎫
              </label>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                {maxSeats} available
              </span>
            </div>

            {/* Visual Seat Counter */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between gap-4">
                {/* Minus Button */}
                <button
                  onClick={decrementSeats}
                  disabled={seatsToBook <= 1 || loading}
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-lg transition ${
                    seatsToBook <= 1 || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200 active:scale-95"
                  }`}
                >
                  −
                </button>

                {/* Seat Input */}
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    min="1"
                    max={maxSeats}
                    value={seatsToBook}
                    onChange={(e) => handleSeatsChange(parseInt(e.target.value) || 1)}
                    className="w-full text-5xl font-bold text-center border-0 bg-transparent text-emerald-600 focus:outline-none"
                  />
                  <p className="text-sm text-gray-600 mt-1">Seats Selected</p>
                </div>

                {/* Plus Button */}
                <button
                  onClick={incrementSeats}
                  disabled={seatsToBook >= maxSeats || loading}
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-lg transition ${
                    seatsToBook >= maxSeats || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 active:scale-95"
                  }`}
                >
                  +
                </button>
              </div>

              {/* Seat Range Indicator */}
              <div className="mt-4 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(seatsToBook / maxSeats) * 100}%` }}
                ></div>
              </div>

              <p className="text-xs text-gray-600 mt-2 text-center">
                Valid range: 1 to {maxSeats} seats
              </p>
            </div>

            {/* Seat Error Message */}
            {seatErrors && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-700 font-medium text-sm">⚠️ {seatErrors}</p>
              </div>
            )}

            {/* Seat Grid Display (Optional Visual Representation) */}
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Seat Preview:</p>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: maxSeats }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition ${
                      i < seatsToBook
                        ? "bg-emerald-500 text-white scale-110"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-900">Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Driver Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Driver Info</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Driver</span>
                <span className="font-semibold text-gray-900">{ride.driver?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="font-semibold text-gray-900">⭐ 4.8 (124 rides)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Contact</span>
                <span className="font-semibold text-gray-900">{ride.driver?.email}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Price per seat</span>
              <span className="font-semibold text-gray-900">Rs. {ride.pricePerSeat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Number of seats</span>
              <span className="font-semibold text-gray-900">{seatsToBook}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold bg-blue-50 p-3 rounded-lg">
              <span>Total Amount</span>
              <span className="text-blue-600">Rs. {totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 space-y-3 sticky bottom-0">
          <button
            onClick={handleBooking}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95"
            }`}
          >
            {loading ? "Processing..." : `Confirm & Pay Rs. ${totalPrice}`}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
