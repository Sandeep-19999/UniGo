import User from "../models/users/User.js";
import { verifyToken } from "../utils/jwt.js";

export async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Not authorized: no token." });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Not authorized: user not found." });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized: token invalid/expired." });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authorized." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role." });
    }
    next();
  };
}
