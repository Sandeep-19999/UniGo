import React, { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { formatCurrency } from "../../utils/paymentHelpers";

export default function FareCalculator({ bookingData = {} }) {
  const [formData, setFormData] = useState({
    distance: "",
    duration: "",
    seatsBooked: "1",
  });

  const [fareBreakdown, setFareBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prefill form with booking data if available
  useEffect(() => {
    if (bookingData?.bookingDetails) {
      const { distanceKm, timeMin } = bookingData.bookingDetails;
      setFormData((prev) => ({
        ...prev,
        distance: distanceKm ? String(distanceKm) : prev.distance,
        duration: timeMin ? String(timeMin) : prev.duration,
      }));
    }
  }, [bookingData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCalculateFare = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/payment/fare/calculate", {
        distance: parseFloat(formData.distance),
        duration: parseFloat(formData.duration),
        seatsBooked: parseInt(formData.seatsBooked, 10),
      });
      setFareBreakdown(data.fareBreakdown);
    } catch (error) {
      console.error("Error calculating fare:", error);
      alert(error?.response?.data?.message || "Failed to calculate fare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCalculateFare} className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Distance (km) *
            </label>
            <input
              type="number"
              name="distance"
              value={formData.distance}
              onChange={handleInputChange}
              required
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="5.5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              step="1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="15"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seats Booked *
            </label>
            <select
              name="seatsBooked"
              value={formData.seatsBooked}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1">1 Seat</option>
              <option value="2">2 Seats</option>
              <option value="3">3 Seats</option>
              <option value="4">4 Seats</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all disabled:opacity-50"
        >
          {loading ? "Calculating..." : "🧮 Calculate Fare"}
        </button>
      </form>

      {/* Fare Breakdown */}
      {fareBreakdown && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            💰 Fare Breakdown
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Base Fare:</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.baseFare, fareBreakdown.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Distance Fare:</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.distanceFare, fareBreakdown.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Time Fare:</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.timeFare, fareBreakdown.currency)}</span>
            </div>
            {fareBreakdown.surgeFare > 0 && (
              <div className="flex justify-between text-orange-700 bg-orange-50 px-3 py-2 rounded">
                <span>Surge Pricing (+50%):</span>
                <span className="font-semibold">{formatCurrency(fareBreakdown.surgeFare, fareBreakdown.currency)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-3 flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.subtotal, fareBreakdown.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax (15%):</span>
              <span className="font-semibold">{formatCurrency(fareBreakdown.tax, fareBreakdown.currency)}</span>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-lg flex justify-between items-center text-lg font-bold">
              <span>Per Seat Total:</span>
              <span>{formatCurrency(fareBreakdown.farePerSeat, fareBreakdown.currency)}</span>
            </div>

            <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg text-sm text-blue-900">
              <p>
                <span className="font-semibold">Total for all seats:</span>{" "}
                {formatCurrency(fareBreakdown.total, fareBreakdown.currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fare Rates Information */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">📋 Standard Rates</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Base Fare:</span> LKR 150
          </div>
          <div>
            <span className="font-semibold">Distance Rate:</span> LKR 40/km
          </div>
          <div>
            <span className="font-semibold">Time Rate:</span> LKR 2/min
          </div>
          <div className="md:col-span-3">
            <span className="font-semibold">Tax:</span> 15% on total (currency: LKR)
          </div>
        </div>
      </div>
    </div>
  );
}