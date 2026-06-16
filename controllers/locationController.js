// controllers/locationController.js
const Location = require('../models/Location');

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const searchLocations = async (req, res) => {
  try {
    const { q, type } = req.query;
    let query = {};

    if (q && q.trim() !== '') {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: regex }, { keywords: regex },
        { department: regex }, { description: regex },
        { room: regex }, { block: regex },
      ];
    }

    if (type && type !== 'all') query.type = type.toLowerCase();

    const locations = await Location.find(query).sort({ name: 1 }).limit(20).select('-__v');
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search error', error: error.message });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ type: 1, name: 1 }).select('-__v');
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch locations' });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).select('-__v');
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch location' });
  }
};

// ─── ADD ──────────────────────────────────────────────────────────────────────
const addLocation = async (req, res) => {
  try {
    const { name, type, room, floor, block, department, keywords, description } = req.body;
    if (!name || !type || !room || !floor || !block) {
      return res.status(400).json({ success: false, message: 'Name, type, room, floor, and block are required' });
    }

    let parsedKeywords = [];
    if (Array.isArray(keywords)) parsedKeywords = keywords.map(k => k.toLowerCase().trim()).filter(Boolean);
    else if (typeof keywords === 'string') parsedKeywords = keywords.split(',').map(k => k.toLowerCase().trim()).filter(Boolean);

    const nameWords = name.toLowerCase().split(' ').filter(w => w.length > 2);
    parsedKeywords = [...new Set([...parsedKeywords, ...nameWords])];

    const location = await Location.create({ name, type, room, floor, block, department: department || '', keywords: parsedKeywords, description: description || '' });
    res.status(201).json({ success: true, message: 'Location added successfully', data: location });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to add location', error: error.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updateLocation = async (req, res) => {
  try {
    const { keywords, ...rest } = req.body;
    let updateData = { ...rest };
    if (keywords !== undefined) {
      if (Array.isArray(keywords)) updateData.keywords = keywords.map(k => k.toLowerCase().trim()).filter(Boolean);
      else if (typeof keywords === 'string') updateData.keywords = keywords.split(',').map(k => k.toLowerCase().trim()).filter(Boolean);
    }

    const location = await Location.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-__v');
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, message: 'Location updated successfully', data: location });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update location', error: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, message: `"${location.name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete location', error: error.message });
  }
};

// ─── SUGGESTIONS ──────────────────────────────────────────────────────────────
const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(200).json({ success: true, data: [] });
    const regex = new RegExp(q.trim(), 'i');
    const suggestions = await Location.find({ $or: [{ name: regex }, { keywords: regex }] }).limit(8).select('name type department');
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching suggestions' });
  }
};

module.exports = { searchLocations, getAllLocations, getLocationById, addLocation, updateLocation, deleteLocation, getSuggestions };
