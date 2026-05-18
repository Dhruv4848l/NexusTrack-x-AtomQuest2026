const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    sheet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', required: true },
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolved_at: { type: Date, default: null },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escalation', escalationSchema);
