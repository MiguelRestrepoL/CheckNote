const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  age: { type: Number },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken:    { type: String },
  resetTokenExp: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Usuario ", UserSchema)





