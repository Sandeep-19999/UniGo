import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import RideMap from "../../components/RideMap";

const seatOptionsByVehicleType = {
  bike: [1],
  car: [1, 2, 3],
  van: [1, 2, 3, 4, 5, 6, 7, 8],
};

export default function RideRequestForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const pickupGeocodeAbortRef = useRef(null);
  const dropGeocodeAbortRef = useRef(null);
  const [pickupLocationLoading, setPickupLocationLoading] = useState(false);
  const [pickupLocationError, setPickupLocationError] = useState("");

  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropLocation: "",
    numberOfSeats: "1",
    vehicleType: "car",
    paymentMethod: "cash",
    notes: "",
  });
  const [seatOptions, setSeatOptions] = useState(seatOptionsByVehicleType.car);

  useEffect(() => {
    const allowedSeats = seatOptionsByVehicleType[formData.vehicleType] || [];
    setSeatOptions(allowedSeats);

    setFormData((prev) => ({
      ...prev,
      numberOfSeats: allowedSeats.length > 0 ? String(allowedSeats[0]) : "",
    }));

    setErrors((prev) => ({
      ...prev,
      numberOfSeats: "",
    }));
  }, [formData.vehicleType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const reverseGeocodeLocation = async (lat, lng, abortSignal) => {
    const params = new URLSearchParams({
      lat,
      lon: lng,
      format: "json",
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          signal: abortSignal,
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) throw new Error("Reverse geocoding failed");

      const result = await response.json();
      return (
        result.address?.road ||
        result.address?.suburb ||
        result.address?.city ||
        result.display_name ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      );
    } catch (err) {
      if (err.name === "AbortError") return null;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setPickupLocationLoading(true);
      setPickupLocationError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };

          // Update coordinates
          setPickupCoords(coords);

          // Reverse geocode to get address
          const address = await reverseGeocodeLocation(
            latitude,
            longitude,
            new AbortController().signal
          );

          // Update form field with location name
          setFormData((prev) => ({
            ...prev,
            pickupLocation: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));

          setPickupLocationLoading(false);
        },
        (error) => {
          setPickupLocationLoading(false);
          if (error.code === error.PERMISSION_DENIED) {
            setPickupLocationError("Location permission denied. Enable in browser settings.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setPickupLocationError("Location unavailable. Check your GPS.");
          } else {
            setPickupLocationError("Unable to get location. Please try again.");
          }
          console.error("Geolocation error:", error);
        }
      );
    } catch (err) {
      setPickupLocationLoading(false);
      setPickupLocationError("Failed to access device location.");
      console.error("Geolocation error:", err);
    }
  };

  const geocodeLocation = async (query, abortSignal) => {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "lk",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: abortSignal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch coordinates");
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    return {
      lat: Number(results[0].lat),
      lng: Number(results[0].lon),
    };
  };

  useEffect(() => {
    const locationText = formData.pickupLocation.trim();

    if (locationText.length < 3) {
      setPickupCoords(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        pickupGeocodeAbortRef.current?.abort();
        const controller = new AbortController();
        pickupGeocodeAbortRef.current = controller;

        const coords = await geocodeLocation(locationText, controller.signal);

        if (coords) {
          setPickupCoords(coords);
          setErrors((prev) => ({ ...prev, pickupCoords: "" }));
        } else {
          setPickupCoords(null);
          setErrors((prev) => ({
            ...prev,
            pickupCoords: "Pickup location not found on map",
          }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setPickupCoords(null);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [formData.pickupLocation]);

  useEffect(() => {
    const locationText = formData.dropLocation.trim();

    if (locationText.length < 3) {
      setDropCoords(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        dropGeocodeAbortRef.current?.abort();
        const controller = new AbortController();
        dropGeocodeAbortRef.current = controller;

        const coords = await geocodeLocation(locationText, controller.signal);

        if (coords) {
          setDropCoords(coords);
          setErrors((prev) => ({ ...prev, dropCoords: "" }));
        } else {
          setDropCoords(null);
          setErrors((prev) => ({
            ...prev,
            dropCoords: "Drop location not found on map",
          }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setDropCoords(null);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [formData.dropLocation]);

  useEffect(() => {
    if (!routeInfo) {
      setEstimatedFare(0);
      return;
    }

    const ratePerKm = formData.vehicleType === "bike" ? 40 : 60;
    const fare = Number((routeInfo.distanceKm * ratePerKm).toFixed(2));
    setEstimatedFare(fare);
  }, [formData.vehicleType, routeInfo]);

  const handleRouteCalculated = (routeSummary) => {
    setRouteInfo(routeSummary);
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Pickup Location validation
    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = "Pickup location is required";
    } else if (formData.pickupLocation.trim().length < 3) {
      newErrors.pickupLocation = "Pickup location must be at least 3 characters";
    }

    // Drop Location validation
    if (!formData.dropLocation.trim()) {
      newErrors.dropLocation = "Drop location is required";
    } else if (formData.dropLocation.trim().length < 3) {
      newErrors.dropLocation = "Drop location must be at least 3 characters";
    } else if (formData.pickupLocation.trim().toLowerCase() === formData.dropLocation.trim().toLowerCase()) {
      newErrors.dropLocation = "Drop location must be different from pickup location";
    }

    // Number of Seats validation
    const selectedSeatCount = Number(formData.numberOfSeats);
    const allowedSeatsForVehicle = seatOptionsByVehicleType[formData.vehicleType] || [];

    if (!formData.numberOfSeats) {
      newErrors.numberOfSeats = "Number of seats is required";
    } else if (
      Number.isNaN(selectedSeatCount) ||
      !allowedSeatsForVehicle.includes(selectedSeatCount)
    ) {
      newErrors.numberOfSeats = "Please select a valid seat option";
    }

    // Map Coordinates validation
    if (!pickupCoords) {
      newErrors.pickupCoords = "Pickup coordinates are required";
    }
    if (!dropCoords) {
      newErrors.dropCoords = "Drop coordinates are required";
    }
    if (
      pickupCoords &&
      dropCoords &&
      pickupCoords.lat === dropCoords.lat &&
      pickupCoords.lng === dropCoords.lng
    ) {
      newErrors.dropCoords = "Pickup and drop coordinates cannot be the same";
    }

    // Vehicle Type validation
    if (!["bike", "car", "van"].includes(formData.vehicleType)) {
      newErrors.vehicleType = "Please select a valid vehicle type";
    }

    // Payment Method validation
    if (!["cash", "online"].includes(formData.paymentMethod)) {
      newErrors.paymentMethod = "Please select a valid payment method";
    }

    // Notes validation
    if (formData.notes && formData.notes.length > 300) {
      newErrors.notes = "Notes cannot exceed 300 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const seatsValue = Number(formData.numberOfSeats);

      const payload = {
        pickupLocation: formData.pickupLocation.trim(),
        dropLocation: formData.dropLocation.trim(),
        seats: seatsValue,
        numberOfSeats: seatsValue,
        vehicleType: formData.vehicleType,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim(),
        pickupCoords,
        dropCoords,
        distanceKm: routeInfo?.distanceKm || 0,
        timeMin: routeInfo?.timeMin || 0,
        estimatedFare,
      };

      const { data } = await api.post("/passenger/rides", payload);
      setSuccess("Ride request created successfully!");

      // Reset form
      setFormData({
        pickupLocation: "",
        dropLocation: "",
        numberOfSeats: "1",
        vehicleType: "car",
        paymentMethod: "cash",
        notes: "",
      });
      setPickupCoords(null);
      setDropCoords(null);
      setRouteInfo(null);
      setEstimatedFare(0);
      setErrors({});

      // Redirect to my bookings after 1.5 seconds
      setTimeout(() => {
        navigate("/rides/my-bookings");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ride request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Request a Ride</h1>
            <p className="text-gray-600">Book your next ride in minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pickup Location */}
            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup Location <span className="text-red-600">*</span>
              </label>
              
              {/* Location Input with 2 Options */}
              <div className="space-y-2">
                {/* Input Field */}
                <div className="flex gap-2">
                  <input
                    id="pickupLocation"
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    placeholder="Enter location name or use options below"
                    disabled={pickupLocationLoading}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      errors.pickupLocation
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-blue-500"
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                </div>

                {/* 2 Options: Search & Current Location */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: Type Location Search */}
                  <button
                    type="button"
                    disabled={pickupLocationLoading || formData.pickupLocation.trim().length < 3}
                    className={`px-3 py-2 rounded-lg font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${
                      formData.pickupLocation.trim().length < 3 || pickupLocationLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                    }`}
                  >
                    <span>🔍</span> Search Location
                  </button>

                  {/* Option 2: Current Location */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={pickupLocationLoading}
                    className={`px-3 py-2 rounded-lg font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${
                      pickupLocationLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 active:scale-95"
                    }`}
                  >
                    <span>📍</span> {pickupLocationLoading ? "Getting..." : "Current Location"}
                  </button>
                </div>

                {/* Pickup Coords Display */}
                {pickupCoords && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-semibold">Location Set</p>
                    <p className="text-xs text-blue-900">{pickupCoords.lat.toFixed(6)}, {pickupCoords.lng.toFixed(6)}</p>
                  </div>
                )}

                {/* Errors */}
                {(errors.pickupLocation || pickupLocationError) && (
                  <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">{errors.pickupLocation || pickupLocationError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drop Location */}
            <div>
              <label htmlFor="dropLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                Drop Location <span className="text-red-600">*</span>
              </label>
              <input
                id="dropLocation"
                type="text"
                name="dropLocation"
                value={formData.dropLocation}
                onChange={handleChange}
                placeholder="Enter drop location (min 3 characters)"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.dropLocation
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.dropLocation && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.dropLocation}</p>
              )}
            </div>

            {/* Map Selection for Drop Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Drop Location on Map <span className="text-red-600">*</span>
              </label>
              <RideMap
                pickupCoords={pickupCoords}
                dropCoords={dropCoords}
                setPickupCoords={setPickupCoords}
                setDropCoords={setDropCoords}
                onRouteCalculated={handleRouteCalculated}
              />
              {(errors.pickupCoords || errors.dropCoords) && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.pickupCoords || errors.dropCoords}
                </p>
              )}
            </div>

            {/* Vehicle Type */}
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-semibold text-gray-700 mb-2">
                Vehicle Type <span className="text-red-600">*</span>
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.vehicleType
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="bike">🏍️ Bike</option>
                <option value="car">🚗 Car</option>
                <option value="van">🚐 Van</option>
              </select>
              {errors.vehicleType && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.vehicleType}</p>
              )}

              <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-100 space-y-1">
                <p className="text-sm text-green-900 font-medium">
                  Distance: {routeInfo ? `${routeInfo.distanceKm.toFixed(2)} km` : "Select pickup and drop on map"}
                </p>
                <p className="text-sm text-green-900 font-medium">
                  Estimated Time: {routeInfo ? `${routeInfo.timeMin} min` : "Select pickup and drop on map"}
                </p>
                <p className="text-sm text-green-900 font-semibold">
                  Estimated Fare: Rs. {routeInfo ? estimatedFare.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            {/* Number of Seats Selection */}
            <div>
              <label htmlFor="numberOfSeats" className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Seats <span className="text-red-600">*</span>
              </label>
              <select
                id="numberOfSeats"
                name="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.numberOfSeats
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                {seatOptions.map((seatCount) => (
                  <option key={seatCount} value={String(seatCount)}>
                    {seatCount}
                  </option>
                ))}
              </select>
              {errors.numberOfSeats && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.numberOfSeats}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Method <span className="text-red-600">*</span>
              </label>
              <div className={`space-y-3 p-3 rounded-lg border ${
                errors.paymentMethod
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}>
                <div className="flex items-center">
                  <input
                    id="cash"
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === "cash"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="cash" className="ml-3 text-gray-700 cursor-pointer">
                    💵 Cash
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="online"
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === "online"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="online" className="ml-3 text-gray-700 cursor-pointer">
                    💳 Online Payment
                  </label>
                </div>
              </div>
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
                  Additional Notes <span className="text-gray-500">(Optional)</span>
                </label>
                <span className={`text-sm ${
                  formData.notes.length > 300 ? "text-red-600 font-semibold" : "text-gray-500"
                }`}>
                  {formData.notes.length}/300
                </span>
              </div>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special requests or instructions?"
                rows="3"
                maxLength="300"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                  errors.notes
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.notes}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95"
              }`}
            >
              {loading ? "Creating Request..." : "Request Ride"}
            </button>
          </form>

          {/* Back Button */}
          <button
            onClick={() => navigate("/home")}
            className="mt-4 w-full py-2 px-4 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
