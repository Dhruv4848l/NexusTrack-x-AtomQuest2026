const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    // 'return' = manager returns a sheet; 'checkin' = manager comments on a goal quarter
    type: { type: String, enum: ['return', 'checkin'], required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // for type='return'
    sheet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', default: null },
    // for type='checkin'
    goal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
    quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4', null], default: null },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
