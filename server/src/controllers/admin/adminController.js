import Admin from "../../models/admin/Admin.js";
import User from "../../models/users/User.js";
import RideRequest from "../../models/rides/RideRequest.js";
import { DriverEarnings } from "../../models/Payment.js";

// Create admin profile (after registration)
export async function createAdminProfile(req, res, next) {
  try {
    const { userId, adminLevel, department, permissions, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is admin role
    if (user.role !== "admin") {
      return res.status(400).json({ message: "User must have admin role" });
    }

    // Check if admin profile already exists
    const existingAdmin = await Admin.findOne({ user: userId });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin profile already exists" });
    }

    const admin = await Admin.create({
      user: userId,
      adminLevel: adminLevel || "admin",
      department: department || "Operations",
      permissions: permissions || [],
      notes: notes ? notes.trim() : ""
    });

    await admin.populate("user", "name email role");
    res.status(201).json({ message: "Admin profile created", admin });
  } catch (err) {
    next(err);
  }
}

// Get all admins
export async function getAllAdmins(req, res, next) {
  try {
    const admins = await Admin.find()
      .populate("user", "name email phone role createdAt")
      .sort({ createdAt: -1 });

    res.json({ admins, total: admins.length });
  } catch (err) {
    next(err);
  }
}

// Get admin by ID
export async function getAdminById(req, res, next) {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).populate("user", "name email phone role");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ admin });
  } catch (err) {
    next(err);
  }
}

// Update admin profile
export async function updateAdminProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { adminLevel, department, permissions, isActive, notes } = req.body;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (adminLevel) admin.adminLevel = adminLevel;
    if (department) admin.department = department;
    if (permissions) admin.permissions = permissions;
    if (isActive !== undefined) admin.isActive = isActive;
    if (notes !== undefined) admin.notes = notes.trim();

    await admin.save();
    await admin.populate("user", "name email phone role");

    res.json({ message: "Admin profile updated", admin });
  } catch (err) {
    next(err);
  }
}

// Update last login
export async function updateLastLogin(req, res, next) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const admin = await Admin.findOneAndUpdate(
      { user: userId },
      {
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      },
      { new: true }
    ).populate("user", "name email role");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Login recorded", admin });
  } catch (err) {
    next(err);
  }
}

// Delete admin profile
export async function deleteAdminProfile(req, res, next) {
  try {
    const { id } = req.params;

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin profile deleted", admin });
  } catch (err) {
    next(err);
  }
}

// Get admin by user ID
export async function getAdminByUserId(req, res, next) {
  try {
    const { userId } = req.params;

    const admin = await Admin.findOne({ user: userId }).populate("user", "name email phone role");

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    res.json({ admin });
  } catch (err) {
    next(err);
  }
}

// Get all passengers (users with role="user")
export async function getAllPassengers(req, res, next) {
  try {
    const passengers = await User.find({ role: "user" })
      .select("name email phone city createdAt")
      .sort({ createdAt: -1 });

    res.json({ passengers, total: passengers.length });
  } catch (err) {
    next(err);
  }
}

// Delete a passenger user by ID (admin only)
export async function deletePassengerUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Passenger not found." });
    }

    if (user.role !== "user") {
      return res.status(400).json({ message: "Only passenger users can be deleted from this endpoint." });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: "Passenger deleted successfully",
      deletedUserId: id
    });
  } catch (err) {
    next(err);
  }
}

// Get all bookings/ride history for a passenger by user ID
export async function getPassengerBookingsByUserId(req, res, next) {
  try {
    const { id } = req.params;

    const passenger = await User.findOne({ _id: id, role: "user" }).select("name email createdAt");
    if (!passenger) {
      return res.status(404).json({ message: "Passenger not found." });
    }

    const bookings = await RideRequest.find({ passenger: id })
      .select("pickupLocation dropLocation status createdAt")
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map((booking) => {
      const isCompleted = booking.status === "completed";

      return {
        _id: booking._id,
        status: booking.status,
        createdAt: booking.createdAt,
        pickup: {
          label: isCompleted ? booking.pickupLocation || "N/A" : "N/A"
        },
        dropoff: {
          label: isCompleted ? booking.dropLocation || "N/A" : "N/A"
        }
      };
    });

    res.json({
      passenger: {
        _id: passenger._id,
        name: passenger.name,
        email: passenger.email
      },
      bookings: formattedBookings,
      total: formattedBookings.length
    });
  } catch (err) {
    next(err);
  }
}

// Get all drivers (users with role="driver")
export async function getAllDrivers(req, res, next) {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("name email phone location rating createdAt")
      .sort({ createdAt: -1 });

    res.json({ drivers, total: drivers.length });
  } catch (err) {
    next(err);
  }
}

// Get dashboard statistics
export async function getDashboardStats(req, res, next) {
  try {
    // Import models for stats calculation
    const { default: Booking } = await import("../../models/rides/Booking.js");
    const { default: Payment } = await import("../../models/Payment.js");

    const totalPassengers = await User.countDocuments({ role: "user" });
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalAdmins = await Admin.countDocuments();
    
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: "completed" });
    
    let totalRevenue = 0;
    try {
      const payments = await Payment.find({ status: "completed" });
      totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    } catch {
      totalRevenue = 0;
    }

    res.json({
      stats: {
        totalPassengers,
        totalDrivers,
        totalAdmins,
        totalBookings,
        completedBookings,
        totalRevenue,
        activeBookings: totalBookings - completedBookings
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCashoutRequests(req, res, next) {
  try {
    const statusFilter = String(req.query?.status || "").trim();
    const allowed = new Set(["pending", "approved", "paid", "rejected"]);
    const hasStatusFilter = allowed.has(statusFilter);

    const earningsDocs = await DriverEarnings.find({ "cashoutRequests.0": { $exists: true } })
      .populate("driverId", "name email phone")
      .sort({ updatedAt: -1 });

    const items = [];

    earningsDocs.forEach((doc) => {
      (doc.cashoutRequests || []).forEach((request) => {
        if (hasStatusFilter && request.status !== statusFilter) return;

        items.push({
          requestId: request._id,
          driverId: doc.driverId?._id || doc.driverId,
          driverName: doc.driverId?.name || "Unknown Driver",
          driverEmail: doc.driverId?.email || "",
          driverPhone: doc.driverId?.phone || "",
          amount: Number(request.amount || 0),
          method: request.method || "bank_transfer",
          bankName: request.bankName || "",
          accountHolderName: request.accountHolderName || "",
          accountNumber: request.accountNumber || "",
          note: request.note || "",
          status: request.status,
          adminNote: request.adminNote || "",
          payoutReference: request.payoutReference || "",
          requestedAt: request.requestedAt || null,
          processedAt: request.processedAt || null
        });
      });
    });

    items.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

export async function updateCashoutRequestStatus(req, res, next) {
  try {
    const { requestId } = req.params;
    const status = String(req.body?.status || "").trim();
    const adminNote = String(req.body?.adminNote || "").trim();
    const payoutReference = String(req.body?.payoutReference || "").trim();

    if (!["approved", "paid", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use approved, paid, or rejected." });
    }

    const earnings = await DriverEarnings.findOne({ "cashoutRequests._id": requestId });
    if (!earnings) {
      return res.status(404).json({ message: "Cashout request not found." });
    }

    const request = earnings.cashoutRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: "Cashout request not found." });
    }

    if (request.status === "paid") {
      return res.status(400).json({ message: "Paid cashout requests cannot be changed." });
    }

    const previousStatus = request.status;

    if (status === "rejected" && ["pending", "approved"].includes(previousStatus)) {
      const amount = Number(request.amount || 0);
      earnings.availableBalance = Number((Number(earnings.availableBalance || 0) + amount).toFixed(2));
      earnings.totalWithdrawn = Number(Math.max(0, Number(earnings.totalWithdrawn || 0) - amount).toFixed(2));
    }

    request.status = status;
    request.adminNote = adminNote;
    request.payoutReference = payoutReference;
    request.processedBy = req.user?._id || null;
    request.processedAt = new Date();

    earnings.lastUpdated = new Date();
    await earnings.save();

    res.json({
      message: `Cashout request marked as ${status}.`,
      request
    });
  } catch (err) {
    next(err);
  }
}
