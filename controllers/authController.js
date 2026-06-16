// controllers/authController.js
// Handles admin login and token verification

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { username, password }
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find admin by username (case-insensitive via lowercase: true in schema)
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    // Use a generic message to avoid leaking whether the username exists
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Compare submitted password with stored hash
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Build JWT payload (keep small — no sensitive data)
    const payload = {
      id:          admin._id,
      username:    admin.username,
      role:        admin.role,
      displayName: admin.displayName || admin.username,
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        username:    admin.username,
        role:        admin.role,
        displayName: admin.displayName || admin.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// ─── VERIFY TOKEN ─────────────────────────────────────────────────────────────
// GET /api/auth/verify  (protected by authMiddleware)
// Used by frontend on page load to confirm the stored token is still valid
const verify = (req, res) => {
  // If this handler is reached, authMiddleware already validated the token
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    admin: req.admin,
  });
};

module.exports = { login, verify };
