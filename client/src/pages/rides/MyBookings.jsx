import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [paidRideMap, setPaidRideMap] = useState({});
  const [ratingsMap, setRatingsMap] = useState({});
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [ratingSavingId, setRatingSavingId] = useState("");
  const watchIdRef = useRef(null);

  // Add error boundary
  if (error && !loading && !bookings) {
    console.error("❌ Critical render error:", error);
  }

  useEffect(() => {
    let active = true;

    const fetchBookings = async (silent = false) => {
      try {
        console.log("🔵 Fetching bookings...");
        if (!silent) setLoading(true);
        const { data } = await api.get("/passenger/rides");
        console.log("✅ Bookings fetched:", data);
        if (active) setBookings(data.rideRequests || []);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
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

  useEffect(() => {
    let active = true;

    const loadPaymentAndRatingState = async () => {
      const completedBookings = bookings.filter((booking) => booking?.status === "completed" && booking?._id);

      if (completedBookings.length === 0) {
        if (active) {
          setPaidRideMap({});
          setRatingsMap({});
        }
        return;
      }

      try {
        const { data: meData } = await api.get("/auth/me");
        const userId = meData?.user?.id;
        if (!userId) return;

        const { data: paymentData } = await api.get(`/payment/history/${userId}`);
        const payments = Array.isArray(paymentData?.payments) ? paymentData.payments : [];

        const nextPaidRideMap = {};
        for (const payment of payments) {
          const rideId = String(payment?.rideId || "").trim();
          if (!rideId) continue;
          if (payment?.paymentStatus === "Completed") {
            nextPaidRideMap[rideId] = true;
          }
        }

        if (!active) return;
        setPaidRideMap(nextPaidRideMap);

        const paidCompletedBookingIds = completedBookings
          .map((booking) => booking._id)
          .filter((bookingId) => nextPaidRideMap[bookingId]);

        if (paidCompletedBookingIds.length === 0) {
          if (active) setRatingsMap({});
          return;
        }

        const ratingResults = await Promise.all(
          paidCompletedBookingIds.map(async (bookingId) => {
            try {
              const { data } = await api.get(`/rating/booking/${bookingId}`);
              return { bookingId, rating: data?.exists ? data.rating : null };
            } catch {
              return { bookingId, rating: null };
            }
          })
        );

        if (!active) return;
        const nextRatingsMap = {};
        for (const item of ratingResults) {
          if (item.rating) nextRatingsMap[item.bookingId] = item.rating;
        }
        setRatingsMap(nextRatingsMap);
      } catch {
        if (active) {
          setPaidRideMap({});
          setRatingsMap({});
        }
      }
    };

    loadPaymentAndRatingState();

    return () => {
      active = false;
    };
  }, [bookings]);

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

  const handlePayment = (booking) => {
    navigate("/payments", {
      state: {
        bookingId: booking._id,
        pickupLocation: booking.pickupLocation,
        dropLocation: booking.dropLocation,
        paymentMethod: booking.paymentMethod,
        estimatedFare: getDisplayFare(booking),
        bookingDetails: booking
      }
    });
  };

  const handleRatingDraftChange = (bookingId, patch) => {
    setRatingDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating || 0,
        comment: prev[bookingId]?.comment || "",
        ...patch,
      },
    }));
  };

  const handleSubmitRating = async (booking) => {
    const bookingId = booking?._id;
    if (!bookingId) return;

    const draft = ratingDrafts[bookingId] || { rating: 0, comment: "" };
    const rating = Number(draft.rating || 0);
    const comment = String(draft.comment || "").trim();

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating between 1 and 5.");
      return;
    }
    if (comment.length < 3) {
      setError("Please add a short review (at least 3 characters).");
      return;
    }

    setError("");
    setRatingSavingId(bookingId);
    try {
      const { data } = await api.post("/rating", {
        bookingId,
        rating,
        comment,
      });

      setRatingsMap((prev) => ({ ...prev, [bookingId]: data?.rating }));
      setSuccessMessage("Thanks! Your ride rating has been submitted.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit rating.");
    } finally {
      setRatingSavingId("");
    }
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
    if (Number.isInteger(parsedSeats) && parsedSeats > 0) return String(parsedSeats);
    return "N/A";
  };

  const calculateFareFromDistance = (distanceKm, vehicleType = "car") => {
    if (!distanceKm || distanceKm <= 0) return 0;
    const ratePerKm = vehicleType === "bike" ? 40 : 60;
    return Number((distanceKm * ratePerKm).toFixed(2));
  };

  const getDisplayFare = (booking) => {
    // Priority: finalFare > estimatedFare > estimatedPrice > recalculate from distanceKm
    if (booking.finalFare && booking.finalFare > 0) {
      return booking.finalFare;
    }
    if (booking.estimatedFare && booking.estimatedFare > 0) {
      return booking.estimatedFare;
    }
    if (booking.estimatedPrice && booking.estimatedPrice > 0) {
      return booking.estimatedPrice;
    }
    // Fallback: calculate from saved distance
    if (booking.distanceKm && booking.distanceKm > 0) {
      return calculateFareFromDistance(booking.distanceKm, booking.vehicleType);
    }
    return 0;
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

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
            <p className="text-green-800 font-medium text-lg">{successMessage}</p>
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
        ) : !Array.isArray(bookings) ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 font-semibold">Error: Invalid bookings data format</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              if (!booking || !booking._id) {
                console.warn("⚠️ Invalid booking object:", booking);
                return null;
              }
              const isPaid = Boolean(paidRideMap[booking._id]);
              const existingRating = ratingsMap[booking._id] || null;
              const draftRating = ratingDrafts[booking._id]?.rating || 0;
              const draftComment = ratingDrafts[booking._id]?.comment || "";
              return (
              <div key={booking._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">From: {booking.pickupLocation || "Unknown"}</h3>
                        <span className="text-gray-400">→</span>
                        <h3 className="text-lg font-bold text-gray-800">To: {booking.dropLocation || "Unknown"}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"} at{" "}
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${getStatusColor(booking.status || "pending")}`}>{booking.status || "pending"}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Vehicle Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{booking.vehicleType || "Any"}</p>
                      <p className="text-xs text-gray-600 mt-2">Distance: {Number(booking.distanceKm || 0).toFixed(2)} km</p>
                      <p className="text-xs text-gray-600">Time: {Math.round(Number(booking.timeMin || 0))} min</p>
                      <p className="text-xs text-gray-700 font-semibold">Fare: Rs. {getDisplayFare(booking).toFixed(2)}</p>
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
                      <p className="font-semibold text-gray-800 text-xs">{booking._id ? booking._id.slice(-6).toUpperCase() : "N/A"}</p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                      <p className="text-gray-600 text-sm">{booking.notes}</p>
                    </div>
                  )}

                  {booking.acceptedBy ? (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">✓ Accepted Driver Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-blue-600 uppercase font-medium">Driver Name</p>
                          <p className="font-semibold text-gray-800">{booking.acceptedBy?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 uppercase font-medium">Phone</p>
                          <p className="font-semibold text-gray-800">{booking.acceptedBy?.phone || booking.acceptedBy?.email || "N/A"}</p>
                        </div>
                        {booking.acceptedVehicle && (
                          <>
                            <div>
                              <p className="text-xs text-blue-600 uppercase font-medium">Vehicle Type</p>
                              <p className="font-semibold text-gray-800 capitalize">{booking.acceptedVehicle?.type || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 uppercase font-medium">Plate Number</p>
                              <p className="font-semibold text-gray-800">{booking.acceptedVehicle?.plateNumber || "N/A"}</p>
                            </div>
                            {booking.acceptedVehicle?.model && (
                              <div className="col-span-2">
                                <p className="text-xs text-blue-600 uppercase font-medium">Model</p>
                                <p className="font-semibold text-gray-800">{booking.acceptedVehicle.model}</p>
                              </div>
                            )}
                          </>
                        )}
                        {booking.acceptedAt && (
                          <div className="col-span-2">
                            <p className="text-xs text-blue-600 uppercase font-medium">Accepted At</p>
                            <p className="font-semibold text-gray-800">
                              {new Date(booking.acceptedAt).toLocaleDateString()} at{" "}
                              {new Date(booking.acceptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : booking.status === "pending" ? (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">⏳ Waiting for a driver</span> to accept your booking
                      </p>
                    </div>
                  ) : null}

                  {booking.status === "completed" && (
                    <div className={`rounded-lg border p-4 ${isPaid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                      <p className={`text-sm font-semibold ${isPaid ? "text-emerald-800" : "text-amber-800"}`}>
                        {isPaid ? "Payment completed" : "Payment pending"}
                      </p>

                      {!isPaid ? (
                        <p className="mt-1 text-sm text-amber-700">Complete payment to mark this ride fully completed and unlock star rating.</p>
                      ) : existingRating ? (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-emerald-900">Your rating</p>
                          <p className="mt-1 text-lg text-amber-500">{"★".repeat(Number(existingRating.rating || 0))}{"☆".repeat(5 - Number(existingRating.rating || 0))}</p>
                          <p className="mt-1 text-sm text-emerald-800">{existingRating.comment}</p>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <p className="text-sm font-semibold text-emerald-900">Rate this ride</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingDraftChange(booking._id, { rating: star })}
                                className={`text-2xl ${star <= draftRating ? "text-amber-500" : "text-slate-300"}`}
                                aria-label={`Rate ${star} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={draftComment}
                            onChange={(e) => handleRatingDraftChange(booking._id, { comment: e.target.value })}
                            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800"
                            rows={2}
                            maxLength={300}
                            placeholder="Write a short review about your ride"
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitRating(booking)}
                            disabled={ratingSavingId === booking._id}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {ratingSavingId === booking._id ? "Submitting..." : "Submit Rating"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {booking.status !== "completed" && booking.status !== "cancelled" && (
                      <>
                        <button className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">Contact Driver</button>
                        <button onClick={() => handleCancel(booking._id)} className="flex-1 bg-red-100 text-red-700 font-semibold py-2 rounded-lg hover:bg-red-200 transition">Cancel Request</button>
                      </>
                    )}
                    {booking.status === "accepted" && (
                      <button onClick={() => navigate(`/rides/track/${booking._id}`)} className="flex-1 bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition">
                        🗺️ Track Ride
                      </button>
                    )}
                    {booking.status === "started" && (
                      <button onClick={() => navigate(`/rides/track/${booking._id}`)} className="flex-1 bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 transition">
                        🗺️ Track Ride
                      </button>
                    )}
                    {booking.status === "completed" && (
                      isPaid ? (
                        <button className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg cursor-default">
                          ✅ Completed
                        </button>
                      ) : (
                        <button onClick={() => handlePayment(booking)} className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition">
                          💳 Payment
                        </button>
                      )
                    )}
                    {booking.status === "cancelled" && (
                      <button className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg cursor-not-allowed">Request Cancelled</button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}