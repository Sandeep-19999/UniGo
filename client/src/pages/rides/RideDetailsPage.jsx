import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../api/axios";

export default function RideDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/passenger/rides/${bookingId}`);
        console.log("✅ Booking details fetched:", data);
        setBooking(data.rideRequest || data);
      } catch (err) {
        console.error("❌ Error fetching booking details:", err);
        setError(err.response?.data?.message || "Failed to load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

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

  const getDisplayFare = (booking) => {
    if (booking?.finalFare && booking.finalFare > 0) {
      return booking.finalFare;
    }
    if (booking?.estimatedFare && booking.estimatedFare > 0) {
      return booking.estimatedFare;
    }
    if (booking?.estimatedPrice && booking.estimatedPrice > 0) {
      return booking.estimatedPrice;
    }
    if (booking?.distanceKm && booking.distanceKm > 0) {
      const rate = booking.vehicleType === "bike" ? 40 : 60;
      return Number((booking.distanceKm * rate).toFixed(2));
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="unigo-shell min-h-screen px-5 py-8 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg bg-slate-50 px-6 py-12 text-center">
            <p className="text-slate-600">Loading ride details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="unigo-shell min-h-screen px-5 py-8 md:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="text-red-700 font-semibold mb-4">{error || "Ride details not found"}</p>
            <Link
              to="/rides/history"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              ← Back to Ride History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unigo-shell min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Ride Details</h1>
            <p className="mt-1 text-slate-600">
              {booking.pickupLocation} → {booking.dropLocation}
            </p>
          </div>
          <span className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold uppercase ${getStatusColor(booking.status || "pending")}`}>
            {booking.status || "pending"}
          </span>
        </div>

        {/* Route & Fare Card */}
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Route & Fare</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Pickup</p>
                  <p className="font-semibold text-slate-800 text-lg">{booking.pickupLocation || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Drop-off</p>
                  <p className="font-semibold text-slate-800 text-lg">{booking.dropLocation || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Distance</p>
                  <p className="font-semibold text-slate-800">{Number(booking.distanceKm || 0).toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Estimated Fare</p>
                  <p className="font-semibold text-slate-800 text-lg">Rs. {getDisplayFare(booking).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Booking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Booking Time</p>
                <p className="font-semibold text-slate-800">
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Vehicle Type</p>
                <p className="font-semibold text-slate-800 capitalize">{booking.vehicleType || "Any"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Seats Requested</p>
                <p className="font-semibold text-slate-800">{getSeatPreferenceLabel(booking.numberOfSeats)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Payment Method</p>
                <p className="font-semibold text-slate-800 capitalize">{booking.paymentMethod || "N/A"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Special Instructions</p>
                <p className="font-semibold text-slate-800">{booking.specialInstructions || "None"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Details Card - Only show if booking is accepted/completed */}
        {booking.acceptedBy && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 shadow-lg overflow-hidden">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-blue-900">Driver Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 uppercase font-semibold">Driver Name</p>
                  <p className="font-semibold text-blue-900 text-lg">{booking.acceptedBy.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 uppercase font-semibold">Contact</p>
                  <p className="font-semibold text-blue-900">{booking.acceptedBy.phone || booking.acceptedBy.email || "N/A"}</p>
                </div>
                {booking.acceptedVehicle && (
                  <>
                    <div>
                      <p className="text-xs text-blue-700 uppercase font-semibold">Vehicle Type</p>
                      <p className="font-semibold text-blue-900 capitalize">{booking.acceptedVehicle.type || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 uppercase font-semibold">Plate Number</p>
                      <p className="font-semibold text-blue-900">{booking.acceptedVehicle.plateNumber || "N/A"}</p>
                    </div>
                    {booking.acceptedVehicle.model && (
                      <div>
                        <p className="text-xs text-blue-700 uppercase font-semibold">Model</p>
                        <p className="font-semibold text-blue-900">{booking.acceptedVehicle.model}</p>
                      </div>
                    )}
                  </>
                )}
                {booking.acceptedAt && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-blue-700 uppercase font-semibold">Accepted At</p>
                    <p className="font-semibold text-blue-900">
                      {new Date(booking.acceptedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Card - Show status progression */}
        <div className="rounded-lg bg-white shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Ride Timeline</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
                <div>
                  <p className="font-semibold text-slate-900">Booking Created</p>
                  <p className="text-sm text-slate-600">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
              {booking.acceptedAt && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-3 h-3 rounded-full bg-green-500 mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-slate-900">Driver Accepted</p>
                    <p className="text-sm text-slate-600">{new Date(booking.acceptedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {booking.startedAt && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-3 h-3 rounded-full bg-purple-500 mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-slate-900">Ride Started</p>
                    <p className="text-sm text-slate-600">{new Date(booking.startedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-3 h-3 rounded-full bg-emerald-500 mt-1.5"></div>
                  <div>
                    <p className="font-semibold text-slate-900">Ride Completed</p>
                    <p className="text-sm text-slate-600">{new Date(booking.completedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/rides/history"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          >
            ← Back to Ride History
          </Link>
        </div>
      </div>
    </div>
  );
}
