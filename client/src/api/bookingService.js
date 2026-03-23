import axios from "./axios.js";

// Browse APIs (public - no auth required)
export async function searchAvailableRides(origin, destination, date) {
  const params = {};
  if (origin) params.origin = origin;
  if (destination) params.destination = destination;
  if (date) params.date = date;

  const res = await axios.get("/browse/rides", { params });
  return res.data;
}

export async function getRideDetails(rideId) {
  const res = await axios.get(`/browse/rides/${rideId}`);
  return res.data;
}

export async function listAvailableDrivers() {
  const res = await axios.get("/browse/drivers");
  return res.data;
}

export async function getDriverDetails(driverId) {
  const res = await axios.get(`/browse/drivers/${driverId}`);
  return res.data;
}

// Booking APIs
export async function createBooking(rideId, seatsBooked, paymentMethod, notes = "") {
  const res = await axios.post("/passenger/bookings", {
    rideId,
    seatsBooked,
    paymentMethod,
    notes,
  });
  return res.data;
}

export async function listMyBookings() {
  const res = await axios.get("/passenger/bookings");
  return res.data;
}

export async function getBooking(bookingId) {
  const res = await axios.get(`/passenger/bookings/${bookingId}`);
  return res.data;
}

export async function updateBookingStatus(bookingId, status) {
  const res = await axios.put(`/passenger/bookings/${bookingId}/status`, {
    status,
  });
  return res.data;
}

export async function cancelBooking(bookingId) {
  const res = await axios.delete(`/passenger/bookings/${bookingId}`);
  return res.data;
}

export async function listRideBookings(rideId) {
  const res = await axios.get(`/passenger/bookings/ride/${rideId}`);
  return res.data;
}

// Rating APIs
export async function submitRating(bookingId, ratedUserId, stars, comment, ratingType) {
  const res = await axios.post("/ratings", {
    bookingId,
    ratedUserId,
    stars,
    comment,
    ratingType,
  });
  return res.data;
}

export async function getUserRatings(userId, ratingType = null) {
  let url = `/ratings/user/${userId}`;
  if (ratingType) {
    url += `?ratingType=${ratingType}`;
  }
  const res = await axios.get(url);
  return res.data;
}

export async function getBookingRatings(bookingId) {
  const res = await axios.get(`/ratings/booking/${bookingId}`);
  return res.data;
}

export async function deleteRating(ratingId) {
  const res = await axios.delete(`/ratings/${ratingId}`);
  return res.data;
}
