const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    changes: mongoose.Schema.Types.Mixed,
    statusCode: Number,
    ipAddress: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
