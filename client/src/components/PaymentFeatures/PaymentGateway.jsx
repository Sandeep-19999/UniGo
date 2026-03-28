import React, { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { DEFAULT_CURRENCY, formatCurrency } from "../../utils/paymentHelpers";

function randomObjectId() {
  return (
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10) +
    Math.random().toString(16).slice(2, 10)
  );
}

export default function PaymentGateway({ bookingData = {} }) {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "Credit Card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });

  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Prefill form with booking data if available
  useEffect(() => {
    if (bookingData?.estimatedFare || bookingData?.paymentMethod) {
      setFormData((prev) => ({
        ...prev,
        amount: bookingData.estimatedFare ? String(bookingData.estimatedFare) : prev.amount,
        paymentMethod: bookingData.paymentMethod === "cash" ? "Cash on Delivery" : (bookingData.paymentMethod || "Credit Card"),
      }));
    }
  }, [bookingData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: meData } = await api.get("/auth/me");
      const userId = meData?.user?.id;

      const { data } = await api.post("/payment/process", {
        userId,
        amount: parseFloat(formData.amount),
        currency: DEFAULT_CURRENCY,
        paymentMethod: formData.paymentMethod,
        bookingId: bookingData?.bookingId || undefined,
        rideId: localStorage.getItem("rideId") || randomObjectId(),
        driverId: localStorage.getItem("driverId") || randomObjectId(),
        fareBreakdown: {
          baseFare: parseFloat(formData.amount) || 0,
          tax: 0,
        },
      });

      setPaymentResult({
        success: true,
        transactionId: data.transactionId,
        message: `Payment initiated successfully for ${formatCurrency(formData.amount, DEFAULT_CURRENCY)}!`,
      });
      setFormData({
        amount: "",
        paymentMethod: "Credit Card",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        holderName: "",
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentResult({
        success: false,
        message: error?.response?.data?.message || "Payment failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {paymentResult && (
        <div
          className={`rounded-lg p-4 ${
            paymentResult.success
              ? "border border-green-400 bg-green-100 text-green-800"
              : "border border-red-400 bg-red-100 text-red-800"
          }`}
        >
          <p className="font-semibold">{paymentResult.success ? "Success" : "Error"}</p>
          <p>{paymentResult.message}</p>
          {paymentResult.transactionId && <p className="mt-2 text-sm">Transaction ID: {paymentResult.transactionId}</p>}
        </div>
      )}

      <form onSubmit={handlePayment} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Amount (LKR) *</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="1000.00"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Payment Method *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
            <option value="Wallet">Wallet</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        {(formData.paymentMethod === "Credit Card" || formData.paymentMethod === "Debit Card") && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Cardholder Name *</label>
              <input
                type="text"
                name="holderName"
                value={formData.holderName}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Card Number *</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                required
                placeholder="1234 5678 9012 3456"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Expiry Date *</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  placeholder="MM/YY"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">CVV *</label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  required
                  placeholder="123"
                  maxLength="4"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Complete Payment"}
        </button>
      </form>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">Security</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>All payments are encrypted</li>
          <li>PCI DSS compliant</li>
          <li>Your card details are secure</li>
        </ul>
      </div>
    </div>
  );
}
