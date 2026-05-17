const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    employee_id: { type: String, unique: true, sparse: true },
    phone_number: { type: String, default: null },
    dob: { type: Date, default: null },
    department: { type: String, default: null },
    avatar_color: { type: String, default: null },
    profile_image: { type: String, default: null },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    roles: {
      type: [String],
      enum: ['employee', 'manager', 'admin', 'database_admin'],
      default: ['employee'],
    },
    is_first_login: { type: Boolean, default: true },
    otp_code: { type: String, default: null },
    otp_expires: { type: Date, default: null },
    personal_email: { type: String, lowercase: true, trim: true, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: full_name = first_name + last_name
userSchema.virtual('full_name').get(function () {
  return `${this.first_name} ${this.last_name}`.trim();
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Never return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp_code;
  delete obj.otp_expires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
