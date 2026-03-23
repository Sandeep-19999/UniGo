import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as bookingService from "../../api/bookingService";

export default function BrowseRides() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(
    searchParams.get("destination") || ""
  );
  const [date, setDate] = useState(searchParams.get("date") || "");

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get("origin") || searchParams.get("destination")) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      const { rides } = await bookingService.searchAvailableRides(
        origin,
        destination,
        date
      );
      setRides(rides || []);
      setSearched(true);
      setSearchParams({ origin, destination, date });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to search rides");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRide = (rideId) => {
    navigate(`/browse/rides/${rideId}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Search Rides</h1>
        <p className="text-sm text-slate-600 mt-2">
          Find available rides based on your preferences
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              From (Pickup)
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., Colombo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To (Destination)
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Kandy"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            Found {rides.length} ride{rides.length !== 1 ? "s" : ""}
          </h2>

          {rides.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center">
              <p className="text-slate-600">
                No rides found. Try different search parameters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <div
                  key={ride._id}
                  className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        From
                      </p>
                      <p className="font-semibold text-slate-900">
                        {ride.origin.label}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        To
                      </p>
                      <p className="font-semibold text-slate-900">
                        {ride.destination.label}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Departure
                      </p>
                      <p className="text-sm text-slate-900">
                        {new Date(ride.departureTime).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(ride.departureTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Available
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {ride.availableSeats}
                      </p>
                      <p className="text-xs text-slate-600">
                        of {ride.totalSeats} seats
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        Price/Seat
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        Rs.{ride.pricePerSeat}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-slate-600">
                        Driver:{" "}
                        <span className="font-medium text-slate-900">
                          {ride.driver.name}
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        Vehicle:{" "}
                        <span className="font-medium capitalize text-slate-900">
                          {ride.vehicle.type}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewRide(ride._id)}
                      className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      View & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
