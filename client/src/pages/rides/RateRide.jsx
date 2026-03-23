import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as bookingService from "../../api/bookingService";

export default function RateRide() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const rideData = location.state?.ride;
  const driverId = location.state?.driverId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async () => {
    if (!stars) {
      setError("Please select a rating");
      return;
    }

    try {
      setLoading(true);
      await bookingService.submitRating(
        bookingId,
        driverId,
        stars,
        comment,
        "driver"
      );
      setSuccessMsg("Rating submitted successfully!");
      setTimeout(() => {
        navigate("/bookings", { state: { success: "Rating submitted!" } });
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit rating");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <button
        onClick={() => navigate("/bookings")}
        className="text-blue-600 hover:underline text-sm"
      >
        ← Back to Bookings
      </button>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Rate Your Ride</h1>
        <p className="text-slate-600 text-sm">
          Share your experience with the driver
        </p>
      </div>

      {rideData && (
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-600 font-medium">Route</p>
              <p className="text-slate-900">
                {rideData.origin.label} → {rideData.destination.label}
              </p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Date</p>
              <p className="text-slate-900">
                {new Date(rideData.departureTime).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Vehicle</p>
              <p className="text-slate-900 capitalize">{rideData.vehicle.type}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">
            How would you rate this driver?
          </label>
          <div className="flex gap-3 justify-center py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setStars(star)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`w-12 h-12 ${
                    star <= (hoveredStar || stars)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 text-gray-300"
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          <p className="text-center text-slate-600 text-sm">
            {stars === 1 && "Poor"}
            {stars === 2 && "Fair"}
            {stars === 3 && "Good"}
            {stars === 4 && "Very Good"}
            {stars === 5 && "Excellent"}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience... Was the driver friendly? Did they follow the route?"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            rows="4"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={() => navigate("/bookings")}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !stars}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
