const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true },
    phase1_open: { type: Date, required: true },
    phase1_close: { type: Date, required: true },
    q1_open: { type: Date, required: true },
    q1_close: { type: Date, required: true },
    q2_open: { type: Date, required: true },
    q2_close: { type: Date, required: true },
    q3_open: { type: Date, required: true },
    q3_close: { type: Date, required: true },
    q4_open: { type: Date, required: true },
    q4_close: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cycle', cycleSchema);
