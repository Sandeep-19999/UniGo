import User from "../../models/users/User.js";
import Admin from "../../models/admin/Admin.js";
import { signToken } from "../../utils/jwt.js";
import { ensureDriverProfile } from "../../services/onboardingService.js";

function safeUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || "",
    city: u.city || "",
    createdAt: u.createdAt
  };
}

function normalizeRole(role) {
  const value = String(role || "user").trim().toLowerCase();
  if (value === "passenger") return "user";
  return value;
}

function buildName({ name, firstName, lastName }) {
  const directName = String(name || "").trim();
  if (directName) return directName;
  return [String(firstName || "").trim(), String(lastName || "").trim()].filter(Boolean).join(" ").trim();
}

export async function register(req, res, next) {
  try {
    const { name, firstName, lastName, email, password, role, adminInviteCode, phone, city } = req.body;

    const resolvedName = buildName({ name, firstName, lastName });
    if (!resolvedName || !email || !password) {
      return res.status(400).json({ message: "name/email/password are required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    let finalRole = normalizeRole(role);
    if (!["admin", "driver", "user"].includes(finalRole)) finalRole = "user";

    if (finalRole === "admin") {
      const inviteCode = String(adminInviteCode || "").trim();
      const expectedCode = String(process.env.ADMIN_INVITE_CODE || "").trim();
      const ok = inviteCode && expectedCode && inviteCode === expectedCode;
      if (!ok) return res.status(403).json({ message: "Admin registration not allowed." });
    }

    const user = await User.create({
      name: resolvedName,
      email: normalizedEmail,
      password: String(password),
      role: finalRole,
      phone: String(phone || "").trim(),
      city: String(city || "").trim()
    });

    if (finalRole === "admin") {
      await Admin.create({
        user: user._id,
        adminLevel: "admin",
        department: "Operations",
        permissions: [],
        isActive: true
      });
    }

    if (finalRole === "driver") {
      await ensureDriverProfile(user);
    }

    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    if (!user.isActive) return res.status(403).json({ message: "Account is inactive." });

    const ok = await user.comparePassword(String(password));
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    user.lastLoginAt = new Date();
    await user.save();

    if (user.role === "driver") {
      await ensureDriverProfile(user);
    }

    const token = signToken({ id: user._id, role: user.role });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}
