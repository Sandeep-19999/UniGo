import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import BookingConfirmationModal from "../../components/BookingConfirmationModal";

export default function BrowseDrivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/passenger/available-rides");
        // Filter available rides with drivers
        setDrivers(data.rides || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleBookNow = (ride) => {
    setSelectedRide(ride);
    setShowModal(true);
  };

  const handleBookingSuccess = (booking) => {
    // Refresh driver list
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading available drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Browse Available Drivers</h1>
          <p className="text-gray-600">Find the perfect driver for your next ride</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Drivers Grid */}
        {drivers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Drivers Available</h2>
            <p className="text-gray-600 mb-6">
              No drivers are currently offering rides. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((ride) => (
              <div
                key={ride._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Driver Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{ride.driver?.name || "Driver"}</h3>
                      <p className="text-blue-100 text-sm">Professional Driver</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">⭐ 4.8</p>
                      <p className="text-xs text-blue-100">(124 rides)</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Vehicle Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle</label>
                    <p className="text-lg font-bold text-gray-800">
                      {ride.vehicle?.type?.toUpperCase() || "Car"}
                    </p>
                    <p className="text-sm text-gray-600">Plate: {ride.vehicle?.plateNumber}</p>
                    <p className="text-sm text-gray-600">Capacity: {ride.vehicle?.seatCapacity} seats</p>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="font-semibold text-gray-800">{ride.origin?.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="flex-1 h-0.5 bg-gray-300"></span>
                      <span className="text-xs">~{Math.round(Math.random() * 20) + 5} km</span>
                      <span className="flex-1 h-0.5 bg-gray-300"></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="font-semibold text-gray-800">{ride.destination?.label}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Departure</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(ride.departureTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available Seats</p>
                      <p className="font-semibold text-green-600">{ride.availableSeats} seats</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Price per Seat</p>
                      <p className="font-semibold text-gray-800">
                        Rs. {ride.pricePerSeat || 0}
                      </p>
                      onClick={() => handleBookNow(ride)}
                      className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
                    
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-semibold text-blue-600 capitalize">{ride.status}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
                      Book Now
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        ride={selectedRide}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onBookingSuccess={handleBookingSuccess}
      />
          </div>
        )}
      </div>
    </div>
  );
}
