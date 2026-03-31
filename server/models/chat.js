const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Group admin — creator or the system admin if they are in the group
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
