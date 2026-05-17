const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    entity: { type: String, required: true }, // e.g. 'goal_sheet', 'achievement', 'cycle'
    entity_id: { type: String, default: null }, // stored as string for flexibility
    action: { type: String, required: true }, // e.g. 'submitted', 'approved_locked', 'returned'
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
