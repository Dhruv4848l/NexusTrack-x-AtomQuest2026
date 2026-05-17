const mongoose = require('mongoose');
const { UOM_TYPES } = require('../utils/scoreEngine');

const goalSchema = new mongoose.Schema(
  {
    sheet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', required: true },
    shared_parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
    thrust_area: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    uom_type: { type: String, enum: UOM_TYPES, required: true },
    target: { type: Number, default: null },
    target_date: { type: Date, default: null },
    weightage: { type: Number, required: true, min: 10, max: 100 },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
