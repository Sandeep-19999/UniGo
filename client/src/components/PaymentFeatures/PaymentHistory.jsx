import React, { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { formatCurrency } from "../../utils/paymentHelpers";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const { data: meData } = await api.get("/auth/me");
      const userId = meData?.user?.id;
      if (!userId) throw new Error("User not found");

      const { data } = await api.get(`/payment/history/${userId}`);
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {payments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center">
          <p className="text-gray-600">No payment history found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => setSelectedPayment(selectedPayment?._id === payment._id ? null : payment)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">Transaction {payment.transactionId}</h4>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        payment.paymentStatus === "Completed"
                          ? "bg-green-100 text-green-800"
                          : payment.paymentStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 md:grid-cols-4">
                    <div>
                      <span className="font-semibold">Amount:</span>{" "}
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div>
                      <span className="font-semibold">Method:</span> {payment.paymentMethod}
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span> {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-semibold">Time:</span> {new Date(payment.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <span className="text-2xl">{selectedPayment?._id === payment._id ? "v" : ">"}</span>
              </div>

              {selectedPayment?._id === payment._id && (
                <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h5 className="mb-2 font-semibold text-gray-900">Ride Details</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold">From:</span> {payment.rideDetails?.pickupLocation || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">To:</span> {payment.rideDetails?.dropoffLocation || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Distance:</span> {payment.rideDetails?.distance || 0} km
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="mb-2 font-semibold text-gray-900">Fare Breakdown</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-semibold">Base:</span>{" "}
                          {formatCurrency(payment.fareBreakdown?.baseFare || 0, payment.currency)}
                        </p>
                        <p>
                          <span className="font-semibold">Distance:</span>{" "}
                          {formatCurrency(payment.fareBreakdown?.distanceFare || 0, payment.currency)}
                        </p>
                        <p>
                          <span className="font-semibold">Tax:</span>{" "}
                          {formatCurrency(payment.fareBreakdown?.tax || 0, payment.currency)}
                        </p>
                        <p className="border-t pt-1 font-bold">
                          <span className="font-semibold">Total:</span>{" "}
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
