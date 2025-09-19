
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  details:   { type: String },
  description:   { type: String },
  priority:   { type: String },
  expirationdate: { type: Date },
  state:   { type: String, enum: ["pendiente", "completa"], default: "pendiente" },
  Id:   { type: mongoose.Schema.Types.ObjectId, ref: "cliente" }
}, { timestamps: true });

module.exports = mongoose.model("Tarea", TaskSchema);



