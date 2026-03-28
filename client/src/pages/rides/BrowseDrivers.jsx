import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DriverCard from "../../components/DriverCard";
import BookingConfirmationModal from "../../components/BookingConfirmationModal";
import {
  getAvailableDrivers,
  getMatchingDrivers,
  calculateDistance
} from "../../api/driverService";

export default function BrowseDrivers() {
  // Get location state from SearchRides page
  const navigate = useNavigate();
  const locationState = useLocation();
  const searchData = locationState.state;

  // Tab state
  const [activeTab, setActiveTab] = useState("matching");

  // Data state
  const [matchingDrivers, setMatchingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);

  // Loading/Error state
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");
  const [allError, setAllError] = useState("");

  // Modal state
  const [selectedRide, setSelectedRide] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch matching drivers for the passenger's drop location
  const fetchMatchingDrivers = useCallback(async () => {
    // If no search data, don't fetch
    if (!searchData) {
      setMatchingLoading(false);
      return;
    }

    try {
      setMatchingLoading(true);
      setMatchingError("");

      // Prepare filter params
      const params = {};

      if (searchData.dropCoords?.lat && searchData.dropCoords?.lng) {
        params.lat = searchData.dropCoords.lat;
        params.lng = searchData.dropCoords.lng;
        params.radiusKm = 10; // 10km radius for matching
      } else if (searchData.dropLocation) {
        params.dropLocation = searchData.dropLocation;
      }

      // Fetch matching drivers
      const response = await getMatchingDrivers(params);
      let drivers = response.rides || [];

      // Calculate distances if coordinates are available
      if (searchData.dropCoords?.lat && searchData.dropCoords?.lng) {
        drivers = drivers.map((ride) => ({
          ...ride,
          _distance:
            ride.destination?.lat && ride.destination?.lng
              ? calculateDistance(
                  searchData.dropCoords.lat,
                  searchData.dropCoords.lng,
                  ride.destination.lat,
                  ride.destination.lng
                )
              : null
        }));

        // Sort by distance if coordinates available
        drivers.sort((a, b) => {
          if (a._distance === null) return 1;
          if (b._distance === null) return -1;
          return a._distance - b._distance;
        });
      }

      setMatchingDrivers(drivers);
    } catch (err) {
      setMatchingError(err.message || "Failed to fetch matching drivers");
      setMatchingDrivers([]);
    } finally {
      setMatchingLoading(false);
    }
  }, [searchData]);

  // Fetch all available drivers
  const fetchAllDrivers = useCallback(async () => {
    try {
      setAllLoading(true);
      setAllError("");

      const response = await getAvailableDrivers();
      setAllDrivers(response.rides || []);
    } catch (err) {
      setAllError(err.message || "Failed to fetch available drivers");
      setAllDrivers([]);
    } finally {
      setAllLoading(false);
    }
  }, []);

  // Fetch matching drivers on component mount or when search data changes
  useEffect(() => {
    fetchMatchingDrivers();
  }, [fetchMatchingDrivers]);

  // Fetch all drivers on component mount
  useEffect(() => {
    fetchAllDrivers();
  }, [fetchAllDrivers]);

  // Get current data based on active tab
  const currentDrivers = activeTab === "matching" ? matchingDrivers : allDrivers;
  const isLoading = activeTab === "matching" ? matchingLoading : allLoading;
  const error = activeTab === "matching" ? matchingError : allError;
  const hasSearchData = !!searchData;

  // Handle booking
  const handleBookNow = (ride) => {
    setSelectedRide(ride);
    setShowModal(true);
  };

  const handleViewProfile = (driverId) => {
    console.log("View profile for driver:", driverId);
  };

  const handleBookingSuccess = async () => {
    setShowModal(false);
    setSelectedRide(null);
    // Refresh current tab's drivers
    if (activeTab === "matching") {
      await fetchMatchingDrivers();
    } else {
      await fetchAllDrivers();
    }
  };

  const handleBackToSearch = () => {
    navigate("/rides");
  };

  // Show loading spinner
  if (isLoading && currentDrivers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="py-20 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">Browse Available Drivers</h1>
          <p className="text-gray-600">Choose the perfect driver for your ride</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b border-gray-300 bg-white rounded-t-lg">
          <button
            onClick={() => setActiveTab("matching")}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === "matching"
                ? "border-b-4 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Drivers for Your Destination
            {matchingDrivers.length > 0 && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">{matchingDrivers.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === "all"
                ? "border-b-4 border-blue-600 text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            All Available Drivers
            {allDrivers.length > 0 && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">{allDrivers.length}</span>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "matching" ? (
          // Matching Drivers Tab
          <div>
            {!hasSearchData ? (
              // No search data message
              <div className="rounded-lg bg-white p-12 text-center shadow-lg">
                <div className="mb-4 text-6xl">🔍</div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  Please Search for a Ride First
                </h2>
                <p className="mb-6 text-gray-600">
                  You need to search for a ride on the search page to see matching drivers for your
                  destination.
                </p>
                <button
                  onClick={handleBackToSearch}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Go to Search
                </button>
              </div>
            ) : currentDrivers.length === 0 ? (
              // No matching drivers found
              <div className="rounded-lg bg-white p-12 text-center shadow-lg">
                <div className="mb-4 text-6xl">🚗</div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800">No Drivers Available for Upcoming Time</h2>
                <p className="mb-6 text-gray-600">
                  No drivers are currently available for <strong>{searchData?.dropLocation}</strong> at{" "}
                  <strong>future times</strong>. Try searching for a different destination or check the All
                  Available Drivers tab.
                </p>
                <button
                  onClick={handleBackToSearch}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  New Search
                </button>
              </div>
            ) : (
              // Drivers list
              <>
                <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Showing <strong>{currentDrivers.length}</strong> driver{currentDrivers.length !== 1 ? "s" : ""} available for{" "}
                    <strong>{searchData?.dropLocation}</strong>
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentDrivers.map((ride) => (
                    <DriverCard
                      key={ride._id}
                      ride={ride}
                      distance={ride._distance}
                      onBookNow={handleBookNow}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // All Available Drivers Tab
          <div>
            {allDrivers.length === 0 ? (
              // No drivers found
              <div className="rounded-lg bg-white p-12 text-center shadow-lg">
                <div className="mb-4 text-6xl">🚗</div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800">No Drivers Available for Upcoming Time</h2>
                <p className="text-gray-600">
                  No drivers are currently available for upcoming rides. Please try again later.
                </p>
              </div>
            ) : (
              // Drivers list
              <>
                <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                  <p className="text-sm text-green-800">
                    Showing <strong>{allDrivers.length}</strong> available driver{allDrivers.length !== 1 ? "s" : ""} with upcoming
                    departures
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allDrivers.map((ride) => (
                    <DriverCard
                      key={ride._id}
                      ride={ride}
                      onBookNow={handleBookNow}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Back to Search Button */}
        {hasSearchData && (
          <div className="mt-8 text-center">
            <button
              onClick={handleBackToSearch}
              className="rounded-lg border-2 border-blue-600 px-6 py-2 font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              ← Back to Search
            </button>
          </div>
        )}

        {/* Booking Confirmation Modal */}
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