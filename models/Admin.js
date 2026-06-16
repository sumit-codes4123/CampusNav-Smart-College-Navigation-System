// models/Admin.js
// Admin user schema — passwords are stored as bcrypt hashes, never plaintext

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    // Login username (e.g., "hod_cse", "principal", "coordinator")
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Bcrypt-hashed password — NEVER store plaintext
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    // Role for display/audit purposes
    role: {
      type: String,
      enum: ['hod', 'principal', 'coordinator', 'dept_admin', 'staff'],
      default: 'staff',
    },

    // Human-readable display name
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// ── Pre-save hook: hash password before saving ────────────────────────────────
AdminSchema.pre('save', async function (next) {
  // Only hash if password field was modified (avoids re-hashing on other updates)
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare plaintext password with stored hash ──────────────
AdminSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
