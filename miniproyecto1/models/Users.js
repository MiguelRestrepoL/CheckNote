const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nombredeusuario: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  resetToken:    { type: String },
  resetTokenExp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Usuario ", UserSchema)


