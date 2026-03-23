export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} already exists.` });
  }

  // Default error response
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ message: err.message || "Server error" });
}
