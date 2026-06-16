// models/Location.js
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    type:        { type: String, required: true, enum: ['faculty', 'lab', 'office', 'facility'], lowercase: true },
    room:        { type: String, required: true, trim: true },
    floor:       { type: String, required: true, trim: true },
    block:       { type: String, required: true, trim: true },
    department:  { type: String, trim: true, default: '' },
    keywords:    { type: [String], default: [] },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

LocationSchema.index(
  { name: 'text', keywords: 'text', department: 'text' },
  { weights: { name: 10, keywords: 5, department: 3 } }
);

LocationSchema.index({ type: 1 });

module.exports = mongoose.model('Location', LocationSchema);
