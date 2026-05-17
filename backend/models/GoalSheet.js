const mongoose = require('mongoose');

const goalSheetSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle', required: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved_locked', 'returned', 'completed'],
      default: 'draft',
    },
    submitted_at: { type: Date, default: null },
    approved_at: { type: Date, default: null },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    is_edit_requested: { type: Boolean, default: false },
    edit_request_reason: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound index: one sheet per user per cycle
goalSheetSchema.index({ owner_id: 1, cycle_id: 1 }, { unique: true });

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
