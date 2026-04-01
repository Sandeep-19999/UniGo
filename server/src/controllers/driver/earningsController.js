import { DriverEarnings } from "../../models/Payment.js";
import RideRequest from "../../models/rides/RideRequest.js";
import DriverProfile from "../../models/drivers/DriverProfile.js";

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
    // Fetch completed ride requests for the logged-in driver
    const completedRides = await RideRequest.find({
      acceptedBy: req.user._id,
      status: "completed"
    }).sort({ completedAt: -1 });

    // Calculate earnings using the same logic as Ride History:
    // finalFare ?? estimatedFare ?? estimatedPrice
    let totalEarnings = 0;
    const rideEarnings = [];

    completedRides.forEach((ride) => {
      const fare = Number(ride.finalFare ?? ride.estimatedFare ?? ride.estimatedPrice ?? 0);
      if (fare > 0) {
        totalEarnings += fare;
        rideEarnings.push({
          rideId: ride._id,
          passengerId: ride.passenger?._id || null,
          routeLabel: `${ride.pickupLocation} → ${ride.dropLocation}`,
          amount: fare,
          earnedAt: ride.completedAt || ride.createdAt,
          status: "completed"
        });
      }
    });

    // Get historical earnings data from DriverEarnings model
    const earnings = await DriverEarnings.findOne({ driverId: req.user._id });
    const totalWithdrawn = Number(earnings?.totalWithdrawn || 0);
    const availableBalance = totalEarnings - totalWithdrawn;

    res.json({
      earnings: {
        driverId: req.user._id,
        totalEarnings,
        availableBalance: Math.max(availableBalance, 0),
        totalWithdrawn,
        completedRides: completedRides.length,
        rideEarnings,
        cashoutRequests: earnings?.cashoutRequests || [],
        bonusEarnings: earnings?.bonusEarnings || 0,
        penalties: earnings?.penalties || 0,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyEarningsHistory(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));

    // Fetch recent completed rides for ride earnings history
    const recentRides = await RideRequest.find({
      acceptedBy: req.user._id,
      status: "completed"
    })
      .select("_id pickupLocation dropLocation finalFare estimatedFare estimatedPrice completedAt")
      .sort({ completedAt: -1 })
      .limit(limit);

    // Format ride earnings history
    const rideEarnings = recentRides.map((ride) => ({
      rideId: ride._id,
      date: ride.completedAt || ride.createdAt,
      route: `${ride.pickupLocation} → ${ride.dropLocation}`,
      status: "completed",
      amount: Number(ride.finalFare ?? ride.estimatedFare ?? ride.estimatedPrice ?? 0)
    }));

    // Get cashout requests from DriverEarnings
    const earnings = await DriverEarnings.findOne({ driverId: req.user._id });
    const cashoutRequests = (earnings?.cashoutRequests || [])
      .sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0))
      .slice(0, limit);

    res.json({
      rideEarnings,
      cashoutRequests
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

    const driverProfile = await DriverProfile.findOne({ user: req.user._id }).select("bankAccount");

    const profileBankAccount = driverProfile?.bankAccount || {};
    const finalBankName = bankName || String(profileBankAccount.bankName || "").trim();
    const finalAccountHolderName = accountHolderName || String(profileBankAccount.accountHolderName || "").trim();
    const finalAccountNumber = accountNumber || String(profileBankAccount.accountNumber || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Enter a valid cashout amount." });
    }

    if (!finalBankName || !finalAccountHolderName || !finalAccountNumber) {
      return res.status(400).json({
        message: "Please complete bank account details before requesting a withdrawal."
      });
    }

    // Calculate total earnings from completed rides
    const completedRides = await RideRequest.find({
      acceptedBy: req.user._id,
      status: "completed"
    });

    let totalEarnings = 0;
    completedRides.forEach((ride) => {
      totalEarnings += Number(ride.finalFare ?? ride.estimatedFare ?? ride.estimatedPrice ?? 0);
    });

    // Get or create DriverEarnings record
    let earnings = await DriverEarnings.findOne({ driverId: req.user._id });
    if (!earnings) {
      earnings = new DriverEarnings({
        driverId: req.user._id,
        totalEarnings: totalEarnings,
        availableBalance: totalEarnings,
        totalWithdrawn: 0,
        completedRides: completedRides.length,
        rideEarnings: [],
        cashoutRequests: []
      });
    }

    // Calculate available balance
    const totalWithdrawn = Number(earnings.totalWithdrawn || 0);
    const availableBalance = totalEarnings - totalWithdrawn;

    if (amount > availableBalance) {
      return res.status(400).json({ message: "Cashout amount exceeds available balance." });
    }

    // Update earnings record
    earnings.totalEarnings = totalEarnings;
    earnings.availableBalance = Number((availableBalance - amount).toFixed(2));
    earnings.totalWithdrawn = Number((totalWithdrawn + amount).toFixed(2));
    earnings.completedRides = completedRides.length;
    earnings.cashoutRequests.unshift({
      amount,
      method,
      bankName: finalBankName,
      accountHolderName: finalAccountHolderName,
      accountNumber: finalAccountNumber,
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

export async function getDriverAccountDetails(req, res, next) {
  try {
    const driverProfile = await DriverProfile.findOne({ user: req.user._id }).select("firstName lastName phone bankAccount");

    if (!driverProfile) {
      return res.status(404).json({ message: "Driver profile not found." });
    }

    res.json({
      accountDetails: {
        fullName: `${driverProfile.firstName || ""} ${driverProfile.lastName || ""}`.trim(),
        phone: driverProfile.phone || "",
        bankAccount: {
          accountHolderName: driverProfile.bankAccount?.accountHolderName || "",
          accountNumber: driverProfile.bankAccount?.accountNumber || "",
          bankName: driverProfile.bankAccount?.bankName || "",
          accountType: driverProfile.bankAccount?.accountType || "savings",
          routingNumber: driverProfile.bankAccount?.routingNumber || "",
          isVerified: Boolean(driverProfile.bankAccount?.isVerified)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDriverAccountDetails(req, res, next) {
  try {
    const accountHolderName = String(req.body?.accountHolderName || "").trim();
    const accountNumber = String(req.body?.accountNumber || "").trim();
    const bankName = String(req.body?.bankName || "").trim();
    const accountType = String(req.body?.accountType || "savings").trim();
    const routingNumber = String(req.body?.routingNumber || "").trim();

    if (!accountHolderName || !accountNumber || !bankName) {
      return res.status(400).json({
        message: "Account holder name, account number, and bank name are required."
      });
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          "bankAccount.accountHolderName": accountHolderName,
          "bankAccount.accountNumber": accountNumber,
          "bankAccount.bankName": bankName,
          "bankAccount.accountType": accountType === "checking" ? "checking" : "savings",
          "bankAccount.routingNumber": routingNumber,
          "bankAccount.isVerified": false
        }
      },
      { new: true }
    ).select("firstName lastName phone bankAccount");

    if (!profile) {
      return res.status(404).json({ message: "Driver profile not found." });
    }

    res.json({
      message: "Bank account details saved.",
      accountDetails: {
        fullName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        phone: profile.phone || "",
        bankAccount: profile.bankAccount
      }
    });
  } catch (err) {
    next(err);
  }
}