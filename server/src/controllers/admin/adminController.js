import Admin from "../../models/admin/Admin.js";
import User from "../../models/users/User.js";

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
      .select("name email phone location createdAt")
      .sort({ createdAt: -1 });

    res.json({ passengers, total: passengers.length });
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
