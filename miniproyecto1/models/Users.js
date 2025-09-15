const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  edad: { type: Number },
  correo:    { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  resetToken:    { type: String },
  resetTokenExp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Usuario ", UserSchema)




