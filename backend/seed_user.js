const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected.');
    
    // Check if test user exists
    let user = await User.findOne({ email: 'test_upload@example.com' });
    if (!user) {
      user = await User.create({
        first_name: 'Test',
        last_name: 'User',
        email: 'test_upload@example.com',
        password: 'Password123!',
        roles: ['employee', 'admin'],
        is_first_login: false
      });
      console.log('Test user created.');
    } else {
      console.log('Test user already exists.');
    }
    
    const token = signToken(user._id);
    console.log('--- TEST TOKEN ---');
    console.log(token);
    console.log('------------------');
    
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
