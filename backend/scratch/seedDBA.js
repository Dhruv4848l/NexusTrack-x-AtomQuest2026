const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedDBA = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const dbaEmail = 'dba@atomberg.com';
    const existing = await User.findOne({ email: dbaEmail });
    
    if (existing) {
      console.log('DBA user already exists. Updating roles...');
      existing.roles = ['database_admin'];
      existing.is_first_login = false;
      await existing.save();
      console.log('User updated to database_admin.');
    } else {
      const dba = await User.create({
        first_name: 'Database',
        last_name: 'Admin',
        email: dbaEmail,
        password: 'DbaPassword123!',
        roles: ['database_admin'],
        department: 'IT Infrastructure',
        employee_id: 'DBA001',
        is_first_login: false
      });
      console.log('DBA user created successfully:', dba.email);
    }
    
    // Also update existing admin to new schema
    const admin = await User.findOne({ email: 'admin@atomberg.com' });
    if (admin) {
      admin.first_name = 'System';
      admin.last_name = 'Admin';
      admin.is_first_login = false;
      await admin.save();
      console.log('Admin user updated to new schema.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding DBA:', err);
    process.exit(1);
  }
};

seedDBA();
