// routes/authRoutes.js
const express        = require('express');
const router         = express.Router();
const { login, verify } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login — public
router.post('/login', login);

// GET /api/auth/verify — protected (used by frontend to check token on load)
router.get('/verify', authMiddleware, verify);

module.exports = router;
