const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  detail:   { type: String },
  datetime: { type: Date },
  status:   { type: String, enum: ["pending", "done"], default: "pending" },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User " }
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);
