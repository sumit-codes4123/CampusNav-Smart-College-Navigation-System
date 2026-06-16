// routes/locationRoutes.js
// GET routes are PUBLIC — no auth needed (students can search freely)
// POST / PUT / DELETE routes are PROTECTED — require valid JWT

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
  searchLocations,
  getAllLocations,
  getLocationById,
  addLocation,
  updateLocation,
  deleteLocation,
  getSuggestions,
} = require('../controllers/locationController');

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.get('/search',         searchLocations);
router.get('/suggestions',    getSuggestions);
router.get('/locations',      getAllLocations);
router.get('/locations/:id',  getLocationById);

// ── PROTECTED (admin only) ────────────────────────────────────────────────────
router.post  ('/add-location',          authMiddleware, addLocation);
router.put   ('/update-location/:id',   authMiddleware, updateLocation);
router.delete('/delete-location/:id',   authMiddleware, deleteLocation);

module.exports = router;
