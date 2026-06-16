// routes/aiRoutes.js
// AI Assistant routes — all public (students use without login)

const express      = require('express');
const router       = express.Router();
const { aiSearch } = require('../controllers/aiController');

// POST /api/ai/search
// Body: { query: "Where is the canteen?" }
router.post('/search', aiSearch);

module.exports = router;
