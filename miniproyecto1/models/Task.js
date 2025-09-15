
const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  titulo:    { type: String, required: true },
  detalles:   { type: String },
  descripcion:   { type: String },
  prioridad:   { type: String },
  fechaVencimiento: { type: Date },
  estado:   { type: String, enum: ["pendiente", "completa"], default: "pendiente" },
  clienteId:   { type: mongoose.Schema.Types.ObjectId, ref: "cliente" }
}, { timestamps: true });

module.exports = mongoose.model("Tarea", TaskSchema);


