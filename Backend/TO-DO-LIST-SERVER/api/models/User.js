const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombres: {
    type: String,
    required: [true, 'Los nombres son requeridos'],
    trim: true,
    minlength: [2, 'Los nombres deben tener al menos 2 caracteres'],
    maxlength: [50, 'Los nombres no pueden exceder 50 caracteres']
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son requeridos'],
    trim: true,
    minlength: [2, 'Los apellidos deben tener al menos 2 caracteres'],
    maxlength: [50, 'Los apellidos no pueden exceder 50 caracteres']
  },
  edad: {
    type: Number,
    required: [true, 'La edad es requerida'],
    min: [13, 'La edad debe ser mayor o igual a 13 años'],
    max: [120, 'Edad no válida']
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Por favor ingrese un correo electrónico válido'
    ]
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    validate: {
      validator: function(password) {
        // Validar: al menos 1 mayúscula, 1 número y 1 carácter especial
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        return hasUppercase && hasNumber && hasSpecialChar;
      },
      message: 'La contraseña debe contener al menos 1 mayúscula, 1 número y 1 carácter especial'
    }
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: false // Desactiva el campo __v
});

// Middleware pre-save para hashear la contraseña
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('contrasena')) return next();
  
  try {
    // Hash de la contraseña
    const saltRounds = 12;
    this.contrasena = await bcrypt.hash(this.contrasena, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas (útil para login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

// Método para ocultar la contraseña en las respuestas JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.contrasena;
  return userObject;
};

// Crear el modelo
const User = mongoose.model('User', userSchema);

module.exports = User;