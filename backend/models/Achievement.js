const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    goal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
    actual_value: { type: Number, default: null },
    actual_date: { type: Date, default: null },
    status: {
      type: String,
      enum: ['not_started', 'on_track', 'completed'],
      default: 'not_started',
    },
    computed_score: { type: Number, default: null },
    notes: { type: String, default: null },
    proof_url: { type: String, default: null },
    proof_name: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound unique: one achievement entry per goal per quarter
achievementSchema.index({ goal_id: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
