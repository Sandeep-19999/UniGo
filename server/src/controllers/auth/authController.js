import User from "../../models/users/User.js";
import { signToken } from "../../utils/jwt.js";

function safeUser(u) {
  return { id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role, adminInviteCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, password are required." });

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    let finalRole = role || "user";
    if (!["admin", "driver", "user"].includes(finalRole)) finalRole = "user";

    if (finalRole === "admin") {
      const ok = adminInviteCode && adminInviteCode === process.env.ADMIN_INVITE_CODE;
      if (!ok) return res.status(403).json({ message: "Admin registration not allowed." });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      role: finalRole
    });

    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required." });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const ok = await user.comparePassword(String(password));
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    const token = signToken({ id: user._id, role: user.role });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}
