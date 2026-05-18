const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  try {
    console.log('--- STARTING INTEGRATION TEST ---');
    
    // 1. Admin login (from seedDBA.js credentials)
    console.log('1. Logging in as DBA Admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'dba@atomberg.com',
      password: 'DbaPassword123!'
    });
    const adminToken = adminLogin.data.token;
    console.log('Admin login successful.');

    // Cleanup previous test user if exists
    await mongoose.connect(process.env.MONGODB_URI);
    await User.deleteOne({ email: 'test_integration@atomberg.com' });

    // 2. Create new user
    console.log('2. Creating a new user via API...');
    // We'll use the register endpoint, but since admin creates it, we can just use register directly for test
    const userRes = await axios.post(`${API_URL}/auth/register`, {
      first_name: 'Test',
      last_name: 'Integration',
      email: 'test_integration@atomberg.com',
      password: 'InitialPassword#123',
      department: 'Testing',
      employee_id: 'TEST01',
      roles: ['employee']
    });
    console.log('User created successfully.');

    // 3. First login
    console.log('3. Logging in with new user initial password...');
    const firstLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'test_integration@atomberg.com',
      password: 'InitialPassword#123'
    });
    const userToken = firstLogin.data.token;
    const isFirstLoginData = firstLogin.data.is_first_login;
    console.log(`First login successful. is_first_login flag is: ${isFirstLoginData}`);

    if (!isFirstLoginData) {
      throw new Error('is_first_login should be true!');
    }

    // 4. Change password
    console.log('4. Changing password...');
    await axios.post(`${API_URL}/auth/change-password`, {
      currentPassword: 'InitialPassword#123',
      newPassword: 'ChangedPassword#123',
      repeatPassword: 'ChangedPassword#123'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('Password changed successfully.');

    // 5. Login again with new password
    console.log('5. Logging in again with new password...');
    const secondLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'test_integration@atomberg.com',
      password: 'ChangedPassword#123'
    });
    const isFirstLoginDataAfter = secondLogin.data.is_first_login;
    console.log(`Second login successful. is_first_login flag is now: ${isFirstLoginDataAfter}`);

    if (isFirstLoginDataAfter) {
      throw new Error('is_first_login should be false now!');
    }

    console.log('--- ALL TESTS PASSED ---');
    process.exit(0);

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
