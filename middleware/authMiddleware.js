// middleware/authMiddleware.js
// Protects admin-only API routes — must be attached before sensitive handlers

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Accept token from:  Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — no token provided',
      });
    }

    // Verify the token against the secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach admin info to request for downstream use
    req.admin = decoded;
    next();
  } catch (err) {
    // Covers: expired, malformed, invalid signature
    return res.status(401).json({
      success: false,
      message: 'Unauthorized — invalid or expired token',
    });
  }
};

module.exports = authMiddleware;
