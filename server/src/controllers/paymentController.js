import { v4 as uuidv4 } from 'uuid';
import { Payment, DriverEarnings } from '../models/Payment.js';
import User from '../models/users/User.js';

const allowedPaymentMethods = new Set(['Credit Card', 'Debit Card', 'UPI', 'Wallet', 'Net Banking']);
const objectIdPattern = /^[a-fA-F0-9]{24}$/;

function resolveRequestedUserId(req) {
  const paramUserId = String(req.params.userId || '').trim();
  const authUserId = String(req.user?.id || '').trim();

  if (paramUserId && paramUserId !== authUserId) {
    return null;
  }

  return authUserId;
}

function inferCardBrand(cardNumberDigits) {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(cardNumberDigits)) return 'Visa';
  if (/^5[1-5]\d{14}$/.test(cardNumberDigits) || /^2(2[2-9]|[3-6]\d|7[01]|720)\d{12}$/.test(cardNumberDigits)) return 'Mastercard';
  if (/^3[47]\d{13}$/.test(cardNumberDigits)) return 'Amex';
  if (/^6(?:011|5\d{2})\d{12}$/.test(cardNumberDigits)) return 'Discover';
  return 'Card';
}

// ========== PAYMENT PROCESSING FUNCTIONS ==========

/**
 * Process Payment
 * POST /api/payment/process
 */
export const processPayment = async (req, res) => {
  try {
    const { rideId, driverId, amount, currency, paymentMethod, fareBreakdown, rideDetails } = req.body;
    const userId = req.user.id;

    const normalizedAmount = Number(amount);
    const normalizedRideId = String(rideId || '').trim();
    const normalizedDriverId = String(driverId || '').trim();

    if (!objectIdPattern.test(normalizedRideId)) {
      return res.status(400).json({ message: 'Invalid or missing rideId' });
    }

    if (!objectIdPattern.test(normalizedDriverId)) {
      return res.status(400).json({ message: 'Invalid or missing driverId' });
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }

    if (!allowedPaymentMethods.has(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    const existingPaidPayment = await Payment.findOne({
      userId,
      rideId: normalizedRideId,
      paymentStatus: 'Completed'
    });
    if (existingPaidPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment already completed for this ride',
        transactionId: existingPaidPayment.transactionId,
        payment: existingPaidPayment,
      });
    }

    const transactionId = `TXN-${uuidv4()}`;

    const payment = new Payment({
      transactionId,
      userId,
      rideId: normalizedRideId,
      driverId: normalizedDriverId,
      amount: normalizedAmount,
      currency: currency || 'LKR',
      paymentMethod,
      paymentStatus: 'Completed',
      fareBreakdown: fareBreakdown || {},
      rideDetails: rideDetails || {},
      paymentGateway: {
        gateway: 'Stripe', // Default, can be changed
      },
      paymentProcessedAt: new Date(),
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment completed',
      transactionId,
      payment,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    if (error?.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate payment record detected. Please refresh and try again.',
        error: error.message,
      });
    }
    res.status(500).json({ message: error.message || 'Error processing payment', error: error.message });
  }
};

/**
 * Validate Payment
 * POST /api/payment/validate
 */
export const validatePayment = async (req, res) => {
  try {
    const { transactionId, amount } = req.body;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.amount !== amount) {
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    if (payment.paymentStatus !== 'Pending') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment is valid',
      payment,
    });
  } catch (error) {
    console.error('Error validating payment:', error);
    res.status(500).json({ message: 'Error validating payment', error: error.message });
  }
};

/**
 * Confirm Payment
 * POST /api/payment/confirm/:transactionId
 */
export const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { gatewayTransactionId, gatewayResponse } = req.body;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.paymentStatus = 'Completed';
    payment.paymentProcessedAt = new Date();
    payment.paymentGateway.gatewayTransactionId = gatewayTransactionId;
    payment.paymentGateway.gatewayResponse = gatewayResponse;

    await payment.save();

    // Update driver earnings
    let driverEarnings = await DriverEarnings.findOne({ driverId: payment.driverId });
    if (!driverEarnings) {
      driverEarnings = new DriverEarnings({ driverId: payment.driverId });
    }

    driverEarnings.totalEarnings += payment.amount;
    driverEarnings.completedRides += 1;
    driverEarnings.rideEarnings.push({
      rideId: payment.rideId,
      amount: payment.amount,
      earnedAt: new Date(),
    });

    await driverEarnings.save();

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      payment,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
};

// ========== PAYMENT STATUS FUNCTIONS ==========

/**
 * Get Payment Status
 * GET /api/payment/status/:transactionId
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      status: payment.paymentStatus,
      payment,
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Error fetching payment status', error: error.message });
  }
};

/**
 * Get Payment History
 * GET /api/payment/history/:userId
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Payment.countDocuments({ userId });

    res.status(200).json({
      success: true,
      payments,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

/**
 * Get Payment Receipt
 * GET /api/payment/receipt/:transactionId
 */
export const getPaymentReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.paymentStatus !== 'Completed') {
      return res.status(400).json({ message: 'Payment not yet completed' });
    }

    const receipt = {
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      rideDetails: payment.rideDetails,
      fareBreakdown: payment.fareBreakdown,
      processedAt: payment.paymentProcessedAt,
      receiptUrl: payment.receiptUrl,
    };

    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    res.status(500).json({ message: 'Error fetching payment receipt', error: error.message });
  }
};

// ========== FARE CALCULATION FUNCTIONS ==========

/**
 * Calculate Fare
 * POST /api/payment/fare/calculate
 */
export const calculateFare = async (req, res) => {
  try {
    const { distance, duration, seatsBooked } = req.body;

    if (!distance || !duration || !seatsBooked) {
      return res.status(400).json({ message: 'Distance, duration, and seats are required' });
    }

    const baseFare = 150;
    const distanceRate = 40;
    const timeRatePerMinute = 2;
    const distanceFare = distance * distanceRate;
    const timeFare = duration * timeRatePerMinute;
    const tax = (baseFare + distanceFare + timeFare) * 0.15; // 15% tax

    const total = baseFare + distanceFare + timeFare + tax;
    const farePerSeat = total / seatsBooked;

    const fareBreakdown = {
      baseFare,
      distanceFare: Math.round(distanceFare * 100) / 100,
      timeFare: Math.round(timeFare * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      farePerSeat: Math.round(farePerSeat * 100) / 100,
      currency: 'LKR',
    };

    res.status(200).json({
      success: true,
      fareBreakdown,
    });
  } catch (error) {
    console.error('Error calculating fare:', error);
    res.status(500).json({ message: 'Error calculating fare', error: error.message });
  }
};

/**
 * Get Fare Rates
 * GET /api/payment/fare-rates
 */
export const getFareRates = async (req, res) => {
  try {
    const fareRates = {
      baseFare: 150,
      distanceRate: 40, // per km
      timeRatePerMinute: 2, // per minute
      taxRate: 0.15, // 15%
      surgePricingMultiplier: 1.5, // During peak hours
      currency: 'LKR',
    };

    res.status(200).json({
      success: true,
      fareRates,
    });
  } catch (error) {
    console.error('Error fetching fare rates:', error);
    res.status(500).json({ message: 'Error fetching fare rates', error: error.message });
  }
};

// ========== REFUND FUNCTIONS ==========

/**
 * Request Refund
 * POST /api/payment/refund/request
 */
export const requestRefund = async (req, res) => {
  try {
    const { transactionId, reason, description } = req.body;
    const userId = req.user.id;

    if (!transactionId || !reason) {
      return res.status(400).json({ message: 'Transaction ID and reason are required' });
    }

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.paymentStatus !== 'Completed') {
      return res.status(400).json({ message: 'Only completed payments can be refunded' });
    }

    const refundId = `REF-${uuidv4()}`;

    const refund = {
      refundId,
      transactionId: payment._id,
      amount: payment.amount,
      reason,
      status: 'Pending',
      description: description || '',
      requestedAt: new Date(),
    };

    payment.refund = refund;
    payment.paymentStatus = 'Cancelled';

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Refund request submitted',
      refund,
    });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ message: 'Error requesting refund', error: error.message });
  }
};

/**
 * Get Refund Status
 * GET /api/payment/refund/status/:refundId
 */
export const getRefundStatus = async (req, res) => {
  try {
    const { refundId } = req.params;

    const payment = await Payment.findOne({ 'refund.refundId': refundId });
    if (!payment) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    res.status(200).json({
      success: true,
      refund: payment.refund,
    });
  } catch (error) {
    console.error('Error fetching refund status:', error);
    res.status(500).json({ message: 'Error fetching refund status', error: error.message });
  }
};

/**
 * Get Refund History
 * GET /api/payment/refund/history/:userId
 */
export const getRefundHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ userId, 'refund.refundId': { $exists: true } }).select('refund');

    const refunds = payments.map(p => p.refund);

    res.status(200).json({
      success: true,
      refunds,
    });
  } catch (error) {
    console.error('Error fetching refund history:', error);
    res.status(500).json({ message: 'Error fetching refund history', error: error.message });
  }
};

/**
 * Cancel Refund
 * PUT /api/payment/refund/:refundId/cancel
 */
export const cancelRefund = async (req, res) => {
  try {
    const { refundId } = req.params;

    const payment = await Payment.findOne({ 'refund.refundId': refundId });
    if (!payment) {
      return res.status(404).json({ message: 'Refund not found' });
    }

    if (payment.refund.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending refunds can be cancelled' });
    }

    payment.refund.status = 'Failed';
    payment.paymentStatus = 'Completed';

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Refund cancelled',
      refund: payment.refund,
    });
  } catch (error) {
    console.error('Error cancelling refund:', error);
    res.status(500).json({ message: 'Error cancelling refund', error: error.message });
  }
};

// ========== INVOICE FUNCTIONS ==========

/**
 * Get Invoice
 * GET /api/payment/invoice/:transactionId
 */
export const getInvoice = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      invoice: payment.invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

/**
 * Generate Invoice
 * POST /api/payment/invoice/generate
 */
export const generateInvoice = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = {
      invoiceNumber,
      itemDescription: `Ride from ${payment.rideDetails.pickupLocation} to ${payment.rideDetails.dropoffLocation}`,
      quantity: 1,
      unitPrice: payment.amount,
      tax: payment.fareBreakdown.tax || 0,
      discount: payment.fareBreakdown.discount || 0,
      total: payment.amount,
      issuedAt: new Date(),
    };

    payment.invoice = invoice;
    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Invoice generated',
      invoice,
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Error generating invoice', error: error.message });
  }
};

/**
 * Download Invoice
 * GET /api/payment/invoice/download/:invoiceId
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const payment = await Payment.findOne({ 'invoice.invoiceNumber': invoiceId });
    if (!payment) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice ready for download',
      invoice: payment.invoice,
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Error downloading invoice', error: error.message });
  }
};

// ========== DRIVER EARNINGS FUNCTIONS ==========

/**
 * Get Driver Earnings
 * GET /api/payment/driver-earnings/:driverId
 */
export const getDriverEarnings = async (req, res) => {
  try {
    const { driverId } = req.params;

    const earnings = await DriverEarnings.findOne({ driverId });
    if (!earnings) {
      return res.status(404).json({ message: 'Earnings record not found' });
    }

    res.status(200).json({
      success: true,
      earnings,
    });
  } catch (error) {
    console.error('Error fetching driver earnings:', error);
    res.status(500).json({ message: 'Error fetching driver earnings', error: error.message });
  }
};

/**
 * Get Driver Earnings History
 * GET /api/payment/driver-earnings/:driverId/history
 */
export const getDriverEarningsHistory = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 20 } = req.query;

    const earnings = await DriverEarnings.findOne({ driverId });
    if (!earnings) {
      return res.status(404).json({ message: 'Earnings record not found' });
    }

    const history = earnings.rideEarnings.slice(-limit);

    res.status(200).json({
      success: true,
      earningsHistory: history,
    });
  } catch (error) {
    console.error('Error fetching driver earnings history:', error);
    res.status(500).json({ message: 'Error fetching driver earnings history', error: error.message });
  }
};

/**
 * Withdraw Earnings
 * POST /api/payment/driver-earnings/withdraw
 */
export const withdrawEarnings = async (req, res) => {
  try {
    const { driverId, amount } = req.body;

    if (!driverId || !amount) {
      return res.status(400).json({ message: 'Driver ID and amount are required' });
    }

    const earnings = await DriverEarnings.findOne({ driverId });
    if (!earnings) {
      return res.status(404).json({ message: 'Earnings record not found' });
    }

    if (earnings.totalEarnings < amount) {
      return res.status(400).json({ message: 'Insufficient earnings' });
    }

    earnings.totalEarnings -= amount;
    await earnings.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      remainingEarnings: earnings.totalEarnings,
    });
  } catch (error) {
    console.error('Error withdrawing earnings:', error);
    res.status(500).json({ message: 'Error withdrawing earnings', error: error.message });
  }
};

// ========== PAYMENT METHODS FUNCTIONS ==========

/**
 * Get Payment Methods
 * GET /api/payment/payment-methods/:userId
 */
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = resolveRequestedUserId(req);
    if (!userId) {
      return res.status(403).json({ message: 'Forbidden: cannot access other user payment methods' });
    }

    const user = await User.findById(userId).select('paymentMethods');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethods = (user.paymentMethods || []).map((method) => ({
      _id: method._id,
      methodType: method.methodType,
      cardBrand: method.cardBrand,
      maskedCardNumber: method.maskedCardNumber,
      last4: method.last4,
      expiryDate: method.expiryDate,
      holderName: method.holderName,
      isDefault: Boolean(method.isDefault),
      createdAt: method.createdAt,
    }));

    res.status(200).json({
      success: true,
      paymentMethods,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Error fetching payment methods', error: error.message });
  }
};

/**
 * Add Payment Method
 * POST /api/payment/payment-methods
 */
export const addPaymentMethod = async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, holderName } = req.body;
    const userId = req.user.id;
    const methodType = String(req.body.methodType || 'Credit Card').trim();

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    if (!['Credit Card', 'Debit Card'].includes(methodType)) {
      return res.status(400).json({ message: 'methodType must be Credit Card or Debit Card.' });
    }

    const cardDigits = String(cardNumber || '').replace(/\D/g, '');
    const normalizedExpiry = String(expiryDate || '').trim();
    const normalizedHolder = String(holderName || '').trim();
    const cvvDigits = String(cvv || '').replace(/\D/g, '');

    if (!/^[A-Za-z][A-Za-z\s'.-]{1,59}$/.test(normalizedHolder)) {
      return res.status(400).json({ message: 'Cardholder name should be 2-60 letters/spaces.' });
    }

    if (!/^\d{13,19}$/.test(cardDigits)) {
      return res.status(400).json({ message: 'Card number must contain 13-19 digits.' });
    }

    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(normalizedExpiry)) {
      return res.status(400).json({ message: 'Expiry date must be MM/YY.' });
    }

    if (!/^\d{3,4}$/.test(cvvDigits)) {
      return res.status(400).json({ message: 'CVV must be 3 or 4 digits.' });
    }

    const [monthStr, yearStr] = normalizedExpiry.split('/');
    const month = Number(monthStr);
    const year = 2000 + Number(yearStr);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return res.status(400).json({ message: 'Card expiry date is in the past.' });
    }

    const user = await User.findById(userId).select('paymentMethods');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const last4 = cardDigits.slice(-4);
    const maskedCardNumber = `**** **** **** ${last4}`;
    const cardBrand = inferCardBrand(cardDigits);

    const duplicate = (user.paymentMethods || []).find(
      (method) =>
        method.last4 === last4 &&
        method.expiryDate === normalizedExpiry &&
        String(method.holderName || '').trim().toLowerCase() === normalizedHolder.toLowerCase() &&
        method.methodType === methodType
    );

    if (duplicate) {
      return res.status(409).json({
        message: 'This card is already saved.',
        paymentMethod: duplicate,
      });
    }

    const hasDefault = (user.paymentMethods || []).some((method) => method.isDefault);

    user.paymentMethods.push({
      methodType,
      cardBrand,
      maskedCardNumber,
      last4,
      expiryDate: normalizedExpiry,
      holderName: normalizedHolder,
      isDefault: !hasDefault,
      createdAt: new Date(),
    });

    await user.save();

    const createdMethod = user.paymentMethods[user.paymentMethods.length - 1];

    res.status(201).json({
      success: true,
      message: 'Payment method added',
      paymentMethod: createdMethod,
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Error adding payment method', error: error.message });
  }
};

/**
 * Delete Payment Method
 * DELETE /api/payment/payment-methods/:methodId
 */
export const deletePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;

    const user = await User.findById(req.user.id).select('paymentMethods');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const method = user.paymentMethods.id(methodId);
    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const wasDefault = Boolean(method.isDefault);
    method.deleteOne();

    if (wasDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted',
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Error deleting payment method', error: error.message });
  }
};

/**
 * Set Default Payment Method
 * PUT /api/payment/payment-methods/:methodId/default
 */
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;

    const user = await User.findById(req.user.id).select('paymentMethods');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const method = user.paymentMethods.id(methodId);
    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    user.paymentMethods.forEach((item) => {
      item.isDefault = String(item._id) === String(methodId);
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ message: 'Error setting default payment method', error: error.message });
  }
};

// ========== TRANSACTION FUNCTIONS ==========

/**
 * Get Transactions
 * GET /api/payment/transactions/:userId
 */
export const getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const transactions = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

/**
 * Get Transaction Details
 * GET /api/payment/transaction/:transactionId
 */
export const getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Payment.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ message: 'Error fetching transaction details', error: error.message });
  }
};

// ========== WEBHOOK FUNCTIONS ==========

/**
 * Stripe Webhook
 * POST /api/payment/gateway/webhook/stripe
 */
export const stripeWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Stripe webhook received:', type);

    // Handle different webhook events
    switch (type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', data);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', data);
        break;
      default:
        console.log('Unhandled event type:', type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ message: 'Error processing webhook', error: error.message });
  }
};

/**
 * Razorpay Webhook
 * POST /api/payment/gateway/webhook/razorpay
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log('Razorpay webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'payment.authorized':
        console.log('Payment authorized:', payload);
        break;
      case 'payment.failed':
        console.log('Payment failed:', payload);
        break;
      default:
        console.log('Unhandled event:', event);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).json({ message: 'Error processing webhook', error: error.message });
  }
};