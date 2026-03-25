import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";

export default function RateDriver() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load booking details
  useEffect(() => {
    const loadBooking = async () => {
      try {
        const res = await api.get(`/passenger/bookings/${bookingId}`);
        setBooking(res.data.booking);
        if (res.data.booking.ride?.driver) {
          setDriver(res.data.booking.ride.driver);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/ratings", {
        bookingId,
        rating,
        comment,
        isAnonymous
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/rides/my-bookings");
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="text-center">
          <p className="text-slate-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking || !driver) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">Booking or driver information not found</p>
          <button
            onClick={() => navigate("/rides/my-bookings")}
            className="mt-4 text-red-600 underline"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-700 mb-2">Thank you for rating!</h2>
          <p className="text-green-600 mb-4">Your feedback helps drivers improve their service.</p>
          <p className="text-sm text-green-600">Redirecting to your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <h1 className="text-2xl font-bold">Rate Your Driver</h1>
            <p className="mt-1 text-slate-300">Help us improve our service</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Driver Card */}
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{driver.name}</h3>
                  <p className="text-sm text-slate-600">Ride completed on {new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Rating Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating */}
              <div>
                <label className="block mb-3">
                  <span className="text-sm font-semibold text-slate-900">How would you rate this ride?</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-transform hover:scale-110 ${
                        star <= rating ? "text-yellow-400" : "text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Rating: <span className="font-bold text-slate-900">{rating}/5</span>
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block" htmlFor="comment">
                  <span className="text-sm font-semibold text-slate-900 mb-2 block">Comments (Optional)</span>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this driver..."
                    maxLength={500}
                    rows={4}
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded accent-slate-900"
                />
                <span className="text-sm text-slate-700">Post as anonymous</span>
              </label>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/rides/my-bookings")}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            </form>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 Tip</p>
              <p className="text-xs text-blue-700">
                Honest feedback helps drivers improve and passengers find better rides. Please rate fairly based on your actual experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
