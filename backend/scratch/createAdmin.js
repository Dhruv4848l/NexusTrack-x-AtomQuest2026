const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@atomberg.com';
    const existing = await User.findOne({ email: adminEmail });
    
    if (existing) {
      console.log('Admin user already exists. Updating to admin role...');
      existing.roles = ['employee', 'manager', 'admin'];
      await existing.save();
      console.log('User updated to admin.');
    } else {
      const admin = await User.create({
        full_name: 'System Admin',
        email: adminEmail,
        password: 'AdminPassword123!',
        roles: ['employee', 'manager', 'admin'],
        department: 'Management'
      });
      console.log('Admin user created successfully:', admin.email);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
