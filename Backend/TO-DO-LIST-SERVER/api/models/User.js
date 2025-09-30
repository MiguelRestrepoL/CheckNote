/**
 * @file User.js
 * @description Mongoose model for user management with authentication
 * @module models/User
 * @requires mongoose
 * @requires bcryptjs
 * 
 * @description
 * Defines the User schema and model with comprehensive validation and security features:
 * 
 * **Schema Features:**
 * - Personal information fields (nombres, apellidos, edad)
 * - Unique email with format validation
 * - Strong password with complexity requirements
 * - Automatic timestamps (createdAt, updatedAt)
 * - Automatic password hashing with bcrypt
 * 
 * **Security Features:**
 * - Password hashing with bcrypt (12 salt rounds)
 * - Password complexity validation (uppercase, number, special char)
 * - Password comparison method for authentication
 * - Automatic password removal from JSON responses
 * 
 * **Validation Rules:**
 * - All fields required with custom error messages
 * - String length constraints (2-50 characters)
 * - Age range validation (13-120 years)
 * - Email format validation with regex
 * - Password minimum 8 characters
 * 
 * @example
 * const User = require('./models/User');
 * 
 * // Create new user
 * const user = await User.create({
 *   nombres: 'John',
 *   apellidos: 'Doe',
 *   edad: 25,
 *   correo: 'john@example.com',
 *   contrasena: 'SecurePass123!'
 * });
 * 
 * // Verify password
 * const isValid = await user.comparePassword('SecurePass123!');
 * 
 * @example
 * // JSON output (password automatically hidden)
 * res.json(user); // { _id, nombres, apellidos, edad, correo, createdAt, updatedAt }
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
/**
 * User schema definition
 * @type {mongoose.Schema}
 * @const
 * 
 * @property {string} nombres - User's first name(s)
 * @property {string} apellidos - User's last name(s)
 * @property {number} edad - User's age
 * @property {string} correo - User's email address (unique)
 * @property {string} contrasena - User's hashed password
 * @property {Date} createdAt - Timestamp of user creation (auto-generated)
 * @property {Date} updatedAt - Timestamp of last update (auto-generated)
 */
const userSchema = new mongoose.Schema({
  /**
   * User's first name(s)
   * @type {string}
   * @required
   * @minLength 2
   * @maxLength 50
   * 
   * @description
   * Validation rules:
   * - Required field
   * - Trimmed (whitespace removed)
   * - Minimum 2 characters
   * - Maximum 50 characters
   */
  nombres: {
    type: String,
    required: [true, 'Los nombres son requeridos'],
    trim: true,
    minlength: [2, 'Los nombres deben tener al menos 2 caracteres'],
    maxlength: [50, 'Los nombres no pueden exceder 50 caracteres']
  },
  /**
   * User's last name(s)
   * @type {string}
   * @required
   * @minLength 2
   * @maxLength 50
   * 
   * @description
   * Validation rules:
   * - Required field
   * - Trimmed (whitespace removed)
   * - Minimum 2 characters
   * - Maximum 50 characters
   */
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son requeridos'],
    trim: true,
    minlength: [2, 'Los apellidos deben tener al menos 2 caracteres'],
    maxlength: [50, 'Los apellidos no pueden exceder 50 caracteres']
  },
  /**
   * User's age in years
   * @type {number}
   * @required
   * @min 13
   * @max 120
   * 
   * @description
   * Validation rules:
   * - Required field
   * - Minimum age: 13 years (COPPA compliance)
   * - Maximum age: 120 years (realistic limit)
   */
  edad: {
    type: Number,
    required: [true, 'La edad es requerida'],
    min: [13, 'La edad debe ser mayor o igual a 13 años'],
    max: [120, 'Edad no válida']
  },
   /**
   * User's email address (unique identifier)
   * @type {string}
   * @required
   * @unique
   * 
   * @description
   * Validation rules:
   * - Required field
   * - Unique (enforced by MongoDB index)
   * - Automatically converted to lowercase
   * - Trimmed (whitespace removed)
   * - Must match email regex pattern
   * 
   * Email format validation:
   * - Must contain @ symbol
   * - Must have characters before and after @
   * - Must have domain extension
   * - Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   */
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
  /**
   * User's password (stored as bcrypt hash)
   * @type {string}
   * @required
   * @minLength 8
   * @private
   * 
   * @description
   * Password validation and security:
   * 
   * **Requirements:**
   * - Minimum 8 characters
   * - At least 1 uppercase letter (A-Z)
   * - At least 1 number (0-9)
   * - At least 1 special character (!@#$%^&*()_+-=[]{}etc.)
   * 
   * **Security:**
   * - Automatically hashed with bcrypt before saving
   * - Uses 12 salt rounds for hashing
   * - Never returned in JSON responses
   * - Hash only computed if password is modified
   * 
   * **Storage:**
   * Plain text password is never stored
   * Only bcrypt hash is saved to database
   */
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
  /**
   * Schema options
   * @property {boolean} timestamps - Automatically add createdAt and updatedAt fields
   * @property {boolean} versionKey - Disable __v version field
   */
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  versionKey: false // Desactiva el campo __v
});

/**
 * Pre-save middleware to hash password
 * @memberof module:models/User
 * @function
 * @async
 * 
 * @description
 * Mongoose middleware that runs before saving a user document:
 * 
 * **Process:**
 * 1. Checks if password field was modified
 * 2. If not modified, skips hashing (preserves existing hash)
 * 3. If modified, generates bcrypt hash with 12 salt rounds
 * 4. Replaces plain text password with hash
 * 5. Saves hashed password to database
 * 
 * **Security:**
 * - Uses bcrypt for industry-standard hashing
 * - 12 salt rounds provide strong security (2^12 iterations)
 * - Each password gets unique salt
 * - Resistant to rainbow table attacks
 * 
 * **Performance:**
 * - Only hashes when password changes
 * - Skips hashing on other field updates
 * - Async operation prevents blocking
 * 
 * @param {Function} next - Mongoose middleware next function
 * @throws {Error} If hashing fails
 * 
 * @example
 * // Automatic hashing on user creation
 * const user = new User({
 *   nombres: 'John',
 *   correo: 'john@example.com',
 *   contrasena: 'MyPassword123!' // Plain text
 * });
 * await user.save(); // Password automatically hashed
 * 
 * @example
 * // Password only hashed when changed
 * user.nombres = 'Jane'; // No hashing
 * await user.save();
 * 
 * user.contrasena = 'NewPassword123!'; // Will hash
 * await user.save();
 */
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

/**
 * Compares candidate password with stored hash
 * @memberof module:models/User
 * @instance
 * @async
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches, false otherwise
 * 
 * @description
 * Instance method for password verification during authentication:
 * 
 * **Process:**
 * 1. Takes plain text password from user
 * 2. Compares with stored bcrypt hash
 * 3. Returns true if match, false if no match
 * 
 * **Security:**
 * - Uses bcrypt's constant-time comparison
 * - Prevents timing attacks
 * - Doesn't reveal information about hash
 * 
 * **Usage:**
 * Primary method for login authentication
 * Called by AuthController during login process
 * 
 * @example
 * // During login
 * const user = await User.findOne({ correo: 'john@example.com' });
 * const isValid = await user.comparePassword('MyPassword123!');
 * 
 * if (isValid) {
 *   // Grant access, generate JWT
 * } else {
 *   // Reject login attempt
 * }
 * 
 * @example
 * // Password change verification
 * const isCurrentValid = await user.comparePassword(currentPassword);
 * if (isCurrentValid) {
 *   user.contrasena = newPassword;
 *   await user.save();
 * }
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

/**
 * Removes password from JSON serialization
 * @memberof module:models/User
 * @instance
 * @returns {Object} User object without password field
 * 
 * @description
 * Overrides default toJSON method to ensure password never leaks:
 * 
 * **Security Purpose:**
 * - Prevents accidental password exposure in API responses
 * - Automatically applied when user is sent as JSON
 * - Works with res.json(), JSON.stringify(), etc.
 * 
 * **Implementation:**
 * 1. Converts Mongoose document to plain object
 * 2. Deletes contrasena field
 * 3. Returns sanitized object
 * 
 * **Automatic Usage:**
 * - Triggered by Express res.json(user)
 * - Applied when converting to JSON in any context
 * - No manual filtering required
 * 
 * @example
 * // Automatic password removal in response
 * const user = await User.findById(userId);
 * res.json(user); // Password automatically excluded
 * 
 * // Response:
 * // {
 * //   _id: "507f1f77bcf86cd799439011",
 * //   nombres: "John",
 * //   apellidos: "Doe",
 * //   edad: 25,
 * //   correo: "john@example.com",
 * //   createdAt: "2025-09-29T10:00:00.000Z",
 * //   updatedAt: "2025-09-29T10:00:00.000Z"
 * // }
 * // Note: contrasena field not present
 * 
 * @example
 * // Manual JSON conversion
 * const userJson = user.toJSON();
 * console.log(userJson.contrasena); // undefined
 */
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.contrasena;
  return userObject;
};

/**
 * User model
 * @type {mongoose.Model}
 * @const
 * 
 * @description
 * Mongoose model for User collection with full CRUD operations
 * 
 * **Available Methods:**
 * - Static: find, findOne, findById, create, updateOne, deleteOne, etc.
 * - Instance: save, remove, comparePassword, toJSON
 * 
 * **Indexes:**
 * - Unique index on correo field (automatic)
 * 
 * @example
 * // Create user
 * const user = await User.create({
 *   nombres: 'John',
 *   apellidos: 'Doe',
 *   edad: 25,
 *   correo: 'john@example.com',
 *   contrasena: 'SecurePass123!'
 * });
 * 
 * @example
 * // Find user by email
 * const user = await User.findOne({ correo: 'john@example.com' });
 * 
 * @example
 * // Update user
 * user.nombres = 'Jane';
 * await user.save();
 * 
 * @example
 * // Delete user
 * await User.findByIdAndDelete(userId);
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
