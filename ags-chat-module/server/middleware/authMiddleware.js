const jwt = require("jsonwebtoken");

/**
 * Reuses the existing JWT auth system.
 * Token is read from: Authorization: Bearer <token>
 * Decodes: { _id, name, role, ... }
 *
 * IMPORTANT: Make sure process.env.JWT_SECRET matches the secret
 * used in your existing authController when signing tokens.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { _id, name, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized. Token invalid." });
  }
};

module.exports = { protect };
