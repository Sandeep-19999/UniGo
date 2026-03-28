import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../../api/axios";

// Fix for default marker icons in react-leaflet
const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Driver vehicle icon
const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Passenger icon
const passengerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to auto-fit map bounds
function FitBoundsCom({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

export default function RideTrackingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(null);
  const redirectedRef = useRef(false);

  // Fetch tracking data
  const fetchTracking = async () => {
    try {
      console.log("🔵 Fetching tracking data for:", bookingId);
      const { data } = await api.get(`/passenger/rides/${bookingId}/tracking`);
      console.log("✅ Tracking data:", data);
      setTrackingData(data);
      setError("");
    } catch (err) {
      console.error("❌ Error fetching tracking:", err);
      const errorMsg = err.response?.data?.message || "Failed to load tracking data";
      setError(errorMsg);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect when ride is completed or no active request found
  useEffect(() => {
    if (!error || redirectedRef.current) return;

    // Check if error indicates ride is completed or no active ride
    const completionIndicators = [
      "Active ride request not found",
      "no active ride",
      "completed",
      "finished",
      "ride not found"
    ];

    const isCompletionError = completionIndicators.some(indicator => 
      error.toLowerCase().includes(indicator.toLowerCase())
    );

    if (isCompletionError) {
      console.log("🎉 Ride completed or no longer active. Redirecting to My Bookings...");
      redirectedRef.current = true;
      
      // Small delay to ensure smooth transition
      const timeout = setTimeout(() => {
        navigate("/rides/my-bookings");
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [error, navigate]);

  useEffect(() => {
    fetchTracking();
    // Refresh tracking data every 3 seconds
    const interval = setInterval(fetchTracking, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Calculate map bounds
  const mapPoints = useMemo(() => {
    if (!trackingData) return [];
    const points = [];

    if (trackingData.driver?.currentLocation?.lat && trackingData.driver?.currentLocation?.lng) {
      points.push([trackingData.driver.currentLocation.lat, trackingData.driver.currentLocation.lng]);
    }

    if (trackingData.passenger?.currentLocation?.lat && trackingData.passenger?.currentLocation?.lng) {
      points.push([trackingData.passenger.currentLocation.lat, trackingData.passenger.currentLocation.lng]);
    }

    return points;
  }, [trackingData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 text-lg">Loading live locations...</p>
        </div>
      </div>
    );
  }

  // Check if this is a completion-related error that will cause redirect
  if (error) {
    const completionIndicators = [
      "Active ride request not found",
      "no active ride",
      "completed",
      "finished",
      "ride not found"
    ];

    const isCompletionError = completionIndicators.some(indicator => 
      error.toLowerCase().includes(indicator.toLowerCase())
    );

    // If ride is completed, don't show error card - let it redirect silently
    if (isCompletionError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg">Ride completed. Returning to bookings...</p>
          </div>
        </div>
      );
    }

    // Show error card only for real errors (not completion-related)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Tracking Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/rides/my-bookings")}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Data</h2>
          <p className="text-gray-600 mb-6">Tracking data is not available.</p>
          <button
            onClick={() => navigate("/rides/my-bookings")}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const hasValidLocations =
    (trackingData.driver?.currentLocation?.lat && trackingData.driver?.currentLocation?.lng) ||
    (trackingData.passenger?.currentLocation?.lat && trackingData.passenger?.currentLocation?.lng);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚗 Live Ride Tracking</h1>
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              <p className="font-semibold">Status: <span className="capitalize badge bg-green-100 text-green-800 px-3 py-1 rounded-full">{trackingData.status}</span></p>
            </div>
            <button
              onClick={() => navigate("/rides/my-bookings")}
              className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Back to Bookings
            </button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 uppercase">Pickup</p>
              <p className="font-semibold text-gray-800">{trackingData.pickup?.location}</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-2xl">→</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase">Dropoff</p>
              <p className="font-semibold text-gray-800">{trackingData.drop?.location}</p>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        {trackingData.driver && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-red-500">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🚙 Driver Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 uppercase">Name</p>
                <p className="font-semibold text-gray-800">{trackingData.driver.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase">Contact</p>
                <p className="font-semibold text-gray-800">{trackingData.driver.phone}</p>
              </div>
              {trackingData.driver.vehicle && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 uppercase">Vehicle</p>
                    <p className="font-semibold text-gray-800 capitalize">{trackingData.driver.vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase">Plate Number</p>
                    <p className="font-semibold text-gray-800">{trackingData.driver.vehicle.plateNumber}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {hasValidLocations ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div style={{ height: "500px", width: "100%" }}>
              <MapContainer center={[6.9271, 80.7789]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='<a href="https://leafletjs.com">Leaflet</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Driver Marker */}
                {trackingData.driver?.currentLocation?.lat && trackingData.driver?.currentLocation?.lng && (
                  <Marker
                    position={[trackingData.driver.currentLocation.lat, trackingData.driver.currentLocation.lng]}
                    icon={driverIcon}
                  >
                    <Popup>
                      <div className="font-semibold">
                        🚗 Driver Live Location
                        <br />
                        {trackingData.driver.name}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Passenger Marker */}
                {trackingData.passenger?.currentLocation?.lat && trackingData.passenger?.currentLocation?.lng && (
                  <Marker
                    position={[trackingData.passenger.currentLocation.lat, trackingData.passenger.currentLocation.lng]}
                    icon={passengerIcon}
                  >
                    <Popup>
                      <div className="font-semibold">
                        👤 Your Location
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Auto-fit bounds */}
                <FitBoundsCom points={mapPoints} />
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">📍 Live location data is not yet available. Please try again in a moment.</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Map Legend</h4>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <span style={{ color: "#ff4444" }} className="text-2xl">📍</span>
              <span className="text-gray-700">Driver Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: "#4444ff" }} className="text-2xl">📍</span>
              <span className="text-gray-700">Your Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
