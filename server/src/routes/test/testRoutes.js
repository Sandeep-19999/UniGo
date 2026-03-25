import { Router } from "express";
import User from "../../models/users/User.js";
import Admin from "../../models/admin/Admin.js";

const router = Router();

// Test route to check if a user exists
router.get("/check-user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    
    if (!user) {
      return res.json({ exists: false, message: "User not found" });
    }

    res.json({
      exists: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create test admin account
router.post("/create-test-admin", async (req, res) => {
  try {
    const testEmail = "admin@test.com";
    const testPassword = "admin12345";
    const testName = "Test Admin";

    // Check if already exists
    const exists = await User.findOne({ email: testEmail });
    if (exists) {
      return res.status(409).json({ message: "Test admin already exists", email: testEmail, password: testPassword });
    }

    // Create user
    const user = await User.create({
      name: testName,
      email: testEmail,
      password: testPassword,
      role: "admin"
    });

    // Create admin profile
    await Admin.create({
      user: user._id,
      adminLevel: "admin",
      department: "Operations",
      permissions: [],
      isActive: true
    });

    res.status(201).json({
      message: "Test admin created successfully",
      email: testEmail,
      password: testPassword,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
