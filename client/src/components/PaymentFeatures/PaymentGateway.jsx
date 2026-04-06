import React, { useState, useEffect } from "react";
import { api } from "../../api/axios";
import { DEFAULT_CURRENCY, formatCurrency } from "../../utils/paymentHelpers";

export default function PaymentGateway({ bookingData = {}, currentRide = null, currentRideAmount = 0 }) {
  const cardMethods = ["Credit Card", "Debit Card"];
  const allowedMethods = ["Credit Card", "Debit Card", "UPI", "Wallet", "Net Banking"];

  const normalizeIncomingMethod = (method) => {
    const raw = String(method || "").trim().toLowerCase();
    if (raw === "credit card" || raw === "credit_card") return "Credit Card";
    if (raw === "debit card" || raw === "debit_card") return "Debit Card";
    if (raw === "upi") return "UPI";
    if (raw === "wallet") return "Wallet";
    if (raw === "net banking" || raw === "net_banking") return "Net Banking";

    // Ride flow may provide legacy values like cash/online.
    if (raw === "online") return "Credit Card";
    if (raw === "cash" || raw === "cash on delivery") return "Credit Card";

    return "Credit Card";
  };

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "Credit Card",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [userId, setUserId] = useState("");
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState("");
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveCardForFuture, setSaveCardForFuture] = useState(true);

  const selectedSavedMethod = savedMethods.find((method) => method._id === selectedSavedMethodId) || null;

  const getObjectIdIfValid = (value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    return /^[a-fA-F0-9]{24}$/.test(normalized) ? normalized : "";
  };

  const validateForm = () => {
    const errors = {};
    const normalizedAmount = Number(formData.amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      errors.amount = "Enter a valid amount greater than 0.";
    }

    if (!allowedMethods.includes(formData.paymentMethod)) {
      errors.paymentMethod = "Select a valid payment method.";
    }

    const needsCardInput =
      cardMethods.includes(formData.paymentMethod) &&
      (useNewCard || !selectedSavedMethodId || !selectedSavedMethod);

    if (needsCardInput) {
      const holderName = formData.holderName.trim();
      const cardDigits = formData.cardNumber.replace(/\D/g, "");
      const cvvDigits = formData.cvv.replace(/\D/g, "");
      const expiry = formData.expiryDate.trim();

      if (!/^[A-Za-z][A-Za-z\s'.-]{1,59}$/.test(holderName)) {
        errors.holderName = "Cardholder name should be 2-60 letters/spaces.";
      }

      if (!/^\d{13,19}$/.test(cardDigits)) {
        errors.cardNumber = "Card number must contain 13-19 digits.";
      }

      if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) {
        errors.expiryDate = "Use MM/YY format.";
      } else {
        const [monthStr, yearStr] = expiry.split("/");
        const month = Number(monthStr);
        const year = 2000 + Number(yearStr);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          errors.expiryDate = "Card expiry date is in the past.";
        }
      }

      if (!/^\d{3,4}$/.test(cvvDigits)) {
        errors.cvv = "CVV must be 3 or 4 digits.";
      }
    }

    const rideId = getObjectIdIfValid(currentRide?._id || bookingData?.bookingId || bookingData?.bookingDetails?._id || "");
    const driverId = getObjectIdIfValid(
      currentRide?.acceptedBy?._id ||
      currentRide?.acceptedBy ||
      bookingData?.bookingDetails?.acceptedBy?._id ||
      bookingData?.bookingDetails?.acceptedBy ||
      localStorage.getItem("driverId") ||
      ""
    );

    if (!rideId || !driverId) {
      errors.context = "Active ride or assigned driver not found. Please start/accept a ride before paying.";
    }

    return {
      hasErrors: Object.keys(errors).length > 0,
      errors,
      payload: {
        amount: normalizedAmount,
        rideId,
        driverId,
        holderName: formData.holderName.trim(),
        needsCardInput,
      },
    };
  };

  const fetchSavedMethods = async (resolvedUserId) => {
    if (!resolvedUserId) {
      setSavedMethods([]);
      setSelectedSavedMethodId("");
      setLoadingMethods(false);
      return;
    }

    try {
      const { data } = await api.get(`/payment/payment-methods/${resolvedUserId}`);
      const methods = Array.isArray(data?.paymentMethods) ? data.paymentMethods : [];
      setSavedMethods(methods);

      const defaultMethod = methods.find((method) => method.isDefault) || methods[0] || null;
      setSelectedSavedMethodId(defaultMethod?._id || "");
      setUseNewCard(false);
    } catch {
      setSavedMethods([]);
      setSelectedSavedMethodId("");
    } finally {
      setLoadingMethods(false);
    }
  };

  // Prefill form with booking data if available
  useEffect(() => {
    const defaultAmount = Number(bookingData?.estimatedFare || 0) > 0
      ? Number(bookingData.estimatedFare)
      : Number(currentRideAmount || 0);

    if (defaultAmount > 0 || bookingData?.paymentMethod) {
      setFormData((prev) => ({
        ...prev,
        amount: defaultAmount > 0 ? String(defaultAmount) : prev.amount,
        paymentMethod: normalizeIncomingMethod(bookingData.paymentMethod),
      }));
    }
  }, [bookingData, currentRideAmount]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: meData } = await api.get("/auth/me");
        const resolvedUserId = meData?.user?.id || "";
        if (!active) return;
        setUserId(resolvedUserId);
        await fetchSavedMethods(resolvedUserId);
      } catch {
        if (!active) return;
        setUserId("");
        setSavedMethods([]);
        setSelectedSavedMethodId("");
        setLoadingMethods(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (fieldErrors[name] || fieldErrors.context) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        if (name === "paymentMethod") {
          delete next.cardNumber;
          delete next.expiryDate;
          delete next.cvv;
          delete next.holderName;
        }
        return next;
      });
    }
    setFormData({ ...formData, [name]: value });

    if (name === "paymentMethod" && !cardMethods.includes(value)) {
      setUseNewCard(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const { hasErrors, errors, payload } = validateForm();
    if (hasErrors) {
      setFieldErrors(errors);
      setPaymentResult({
        success: false,
        message: errors.context || "Please fix the highlighted payment fields.",
      });
      return;
    }

    setFieldErrors({});
    setPaymentResult(null);
    setLoading(true);

    try {
      if (!userId) {
        throw new Error("User not found");
      }

      if (
        payload.needsCardInput &&
        saveCardForFuture &&
        cardMethods.includes(formData.paymentMethod)
      ) {
        await api.post("/payment/payment-methods", {
          methodType: formData.paymentMethod,
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          holderName: formData.holderName,
        });

        await fetchSavedMethods(userId);
      }

      const paymentMethodToUse =
        cardMethods.includes(formData.paymentMethod) && !payload.needsCardInput && selectedSavedMethod
          ? selectedSavedMethod.methodType
          : formData.paymentMethod;

      const { data } = await api.post("/payment/process", {
        userId,
        amount: payload.amount,
        currency: DEFAULT_CURRENCY,
        paymentMethod: paymentMethodToUse,
        bookingId: bookingData?.bookingId || currentRide?._id || undefined,
        rideId: payload.rideId,
        driverId: payload.driverId,
        fareBreakdown: {
          baseFare: payload.amount || 0,
          tax: 0,
        },
        rideDetails: {
          pickupLocation: currentRide?.pickupLocation || bookingData?.pickupLocation || "",
          dropoffLocation: currentRide?.dropLocation || bookingData?.dropLocation || "",
          distance: Number(currentRide?.distanceKm || bookingData?.bookingDetails?.distanceKm || 0),
          duration: Number(currentRide?.timeMin || bookingData?.bookingDetails?.timeMin || 0),
          seats: Number(currentRide?.numberOfSeats || bookingData?.bookingDetails?.numberOfSeats || 1),
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
      setUseNewCard(false);
      setSaveCardForFuture(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentResult({
        success: false,
        message: error?.response?.data?.message || error?.response?.data?.error || "Payment failed. Please try again.",
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
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.amount ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                }`}
            placeholder="1000.00"
          />
              {fieldErrors.amount ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.amount}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Payment Method *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.paymentMethod ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                }`}
          >
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
            <option value="Wallet">Wallet</option>
            <option value="Net Banking">Net Banking</option>
          </select>
              {fieldErrors.paymentMethod ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.paymentMethod}</p> : null}
        </div>

        {cardMethods.includes(formData.paymentMethod) && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">Saved Cards</p>
              {savedMethods.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewCard((prev) => !prev)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {useNewCard ? "Use Saved Card" : "Use New Card"}
                </button>
              )}
            </div>

            {loadingMethods ? (
              <p className="text-sm text-slate-600">Loading saved cards...</p>
            ) : savedMethods.length > 0 && !useNewCard ? (
              <>
                <select
                  value={selectedSavedMethodId}
                  onChange={(e) => setSelectedSavedMethodId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {savedMethods.map((method) => (
                    <option key={method._id} value={method._id}>
                      {method.methodType} - {method.maskedCardNumber} ({method.cardBrand})
                      {method.isDefault ? " [Default]" : ""}
                    </option>
                  ))}
                </select>
                {selectedSavedMethod ? (
                  <p className="text-xs text-slate-600">
                    Paying with {selectedSavedMethod.holderName} - {selectedSavedMethod.maskedCardNumber}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-600">No saved card found. Add card details below.</p>
            )}
          </div>
        )}

        {(formData.paymentMethod === "Credit Card" || formData.paymentMethod === "Debit Card") &&
          (useNewCard || savedMethods.length === 0 || !selectedSavedMethodId) && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Cardholder Name *</label>
              <input
                type="text"
                name="holderName"
                value={formData.holderName}
                onChange={handleInputChange}
                required
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.holderName ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                }`}
                placeholder="Full Name"
              />
              {fieldErrors.holderName ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.holderName}</p> : null}
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
                className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.cardNumber ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                }`}
              />
              {fieldErrors.cardNumber ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.cardNumber}</p> : null}
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
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.expiryDate ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                  }`}
                />
                {fieldErrors.expiryDate ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.expiryDate}</p> : null}
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
                  className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                    fieldErrors.cvv ? "border-rose-500 focus:ring-rose-400" : "border-gray-300 focus:ring-purple-500"
                  }`}
                />
                {fieldErrors.cvv ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.cvv}</p> : null}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={saveCardForFuture}
                onChange={(e) => setSaveCardForFuture(e.target.checked)}
              />
              Save this card for future payments
            </label>
          </>
        )}

        {fieldErrors.context ? <p className="text-sm text-rose-600">{fieldErrors.context}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : cardMethods.includes(formData.paymentMethod) && !useNewCard && selectedSavedMethod
              ? `Pay with ${selectedSavedMethod.maskedCardNumber}`
              : "Complete Payment"}
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
