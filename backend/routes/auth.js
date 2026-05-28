const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validatePassword } = require('../utils/validation');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, department, employee_id, roles } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ message: 'first_name, last_name, email, and password are required' });

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password does not meet complexity requirements' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ 
      first_name, 
      last_name, 
      email, 
      password, 
      department: department || null,
      employee_id: employee_id || null,
      roles: roles || ['employee'],
      is_first_login: true // New users must change password
    });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Role Isolation: if requestedRole is specified and the user has it, use it.
    // Otherwise, fall back to the user's primary role (first in their roles array).
    let activeRole = null;
    if (requestedRole && user.roles.includes(requestedRole)) {
      activeRole = requestedRole;
    } else {
      // Auto-select: prefer admin > database_admin > manager > employee
      const priority = ['admin', 'database_admin', 'manager', 'employee'];
      activeRole = priority.find(r => user.roles.includes(r)) || user.roles[0];
    }

    const token = signToken(user._id);
    const userData = user.toJSON();
    res.json({ token, user: userData, is_first_login: user.is_first_login, activeRole });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, repeatPassword } = req.body;
    
    if (newPassword !== repeatPassword)
      return res.status(400).json({ message: 'New passwords do not match' });

    if (!validatePassword(newPassword))
      return res.status(400).json({ message: 'New password does not meet complexity requirements' });

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword)))
      return res.status(401).json({ message: 'Incorrect current password' });

    user.password = newPassword;
    user.is_first_login = false;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password/request
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { identifier } = req.body; // email or phone
    const user = await User.findOne({ $or: [{ email: identifier }, { phone_number: identifier }] });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = otp;
    user.otp_expires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    console.log(`[OTP DEBUG] Sent to ${identifier}: ${otp}`);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/forgot-password/verify
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { identifier, otp, newPassword, repeatPassword } = req.body;
    
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone_number: identifier }],
      otp_code: otp,
      otp_expires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (newPassword !== repeatPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    if (!validatePassword(newPassword))
      return res.status(400).json({ message: 'Password complexity requirements not met' });

    user.password = newPassword;
    user.otp_code = null;
    user.otp_expires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — get current user
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/avatar — upload profile image
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'atomquest_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const user = await User.findById(req.user._id);
    user.profile_image = req.file.path; // Cloudinary returns the URL here
    await user.save();
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/me — update own profile
router.patch('/me', protect, async (req, res) => {
  try {
    const { department, avatar_color, phone_number, dob, profile_image, personal_email } = req.body;
    const updates = {};
    if (department !== undefined) updates.department = department;
    if (avatar_color !== undefined) updates.avatar_color = avatar_color;
    if (phone_number !== undefined) updates.phone_number = phone_number;
    if (dob !== undefined) updates.dob = dob;
    if (profile_image !== undefined) updates.profile_image = profile_image;
    if (personal_email !== undefined) updates.personal_email = personal_email || null;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
