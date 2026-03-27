import { DriverEarnings } from "../../models/Payment.js";

function emptySummary(driverId) {
  return {
    driverId,
    totalEarnings: 0,
    availableBalance: 0,
    totalWithdrawn: 0,
    completedRides: 0,
    rideEarnings: [],
    cashoutRequests: [],
    bonusEarnings: 0,
    penalties: 0,
    lastUpdated: null
  };
}

export async function getMyEarningsSummary(req, res, next) {
  try {
    const earnings = await DriverEarnings.findOne({ driverId: req.user._id });
    res.json({
      earnings: earnings || emptySummary(req.user._id)
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEarningsHistory(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));
    const earnings = await DriverEarnings.findOne({ driverId: req.user._id });

    res.json({
      rideEarnings: (earnings?.rideEarnings || []).slice().sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0)).slice(0, limit),
      cashoutRequests: (earnings?.cashoutRequests || []).slice().sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0)).slice(0, limit)
    });
  } catch (err) {
    next(err);
  }
}

export async function requestCashout(req, res, next) {
  try {
    const amount = Number(req.body?.amount || 0);
    const method = String(req.body?.method || "bank_transfer").trim() || "bank_transfer";
    const bankName = String(req.body?.bankName || "").trim();
    const accountHolderName = String(req.body?.accountHolderName || "").trim();
    const accountNumber = String(req.body?.accountNumber || "").trim();
    const note = String(req.body?.note || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Enter a valid cashout amount." });
    }

    const earnings = await DriverEarnings.findOne({ driverId: req.user._id });
    if (!earnings) {
      return res.status(400).json({ message: "No earnings available for cashout yet." });
    }

    if (amount > Number(earnings.availableBalance || 0)) {
      return res.status(400).json({ message: "Cashout amount exceeds available balance." });
    }

    earnings.availableBalance = Number((Number(earnings.availableBalance || 0) - amount).toFixed(2));
    earnings.totalWithdrawn = Number((Number(earnings.totalWithdrawn || 0) + amount).toFixed(2));
    earnings.cashoutRequests.unshift({
      amount,
      method,
      bankName,
      accountHolderName,
      accountNumber,
      note,
      status: "pending",
      requestedAt: new Date()
    });
    earnings.lastUpdated = new Date();
    await earnings.save();

    res.status(201).json({
      message: "Cashout request submitted successfully.",
      earnings
    });
  } catch (err) {
    next(err);
  }
}