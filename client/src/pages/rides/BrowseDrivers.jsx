import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/axios";
import BookingConfirmationModal from "../../components/BookingConfirmationModal";

export default function BrowseDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/passenger/available-rides");
      setDrivers(data.rides || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleBookNow = (ride) => {
    setSelectedRide(ride);
    setShowModal(true);
  };

  const handleBookingSuccess = async () => {
    setShowModal(false);
    setSelectedRide(null);
    await fetchDrivers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="py-20 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading available drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Browse Available Drivers
          </h1>
          <p className="text-gray-600">Find the perfect driver for your next ride</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {drivers.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-lg">
            <div className="mb-4 text-6xl">🚗</div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              No Drivers Available
            </h2>
            <p className="text-gray-600">
              No drivers are currently offering rides. Please try again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drivers.map((ride) => (
              <div
                key={ride._id}
                className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        {ride.driver?.name || "Driver"}
                      </h3>
                      <p className="text-sm text-blue-100">Professional Driver</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">Available</p>
                      <p className="text-xs text-blue-100">
                        Ride ID: {ride._id?.slice(-6)?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Vehicle
                    </label>
                    <p className="text-lg font-bold text-gray-800">
                      {ride.vehicle?.type?.toUpperCase() || "CAR"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Plate: {ride.vehicle?.plateNumber || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Capacity: {ride.vehicle?.seatCapacity || 0} seats
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="font-semibold text-gray-800">
                          {ride.origin?.label || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="h-0.5 flex-1 bg-gray-300"></span>
                      <span className="text-xs">Route</span>
                      <span className="h-0.5 flex-1 bg-gray-300"></span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="font-semibold text-gray-800">
                          {ride.destination?.label || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
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
                      <p className="font-semibold text-green-600">
                        {ride.availableSeats} seats
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Price per Seat</p>
                      <p className="font-semibold text-gray-800">
                        Rs. {ride.pricePerSeat || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-semibold capitalize text-blue-600">
                        {ride.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => handleBookNow(ride)}
                      className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Book Now
                    </button>

                    <button
                      type="button"
                      className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <BookingConfirmationModal
          ride={selectedRide}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedRide(null);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      </div>
    </div>
  );
}