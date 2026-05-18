const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token (copied logic from auth.js to keep it consistent)
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Initiate Microsoft Login
router.get('/login', (req, res) => {
  const tenant = process.env.ENTRA_TENANT_ID;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const redirectUri = encodeURIComponent(`http://localhost:5000/api/auth/entra/callback`);
  // Requesting basic profile, email, offline access, and permissions to read manager and groups
  const scope = encodeURIComponent('openid profile email offline_access User.Read User.Read.All GroupMember.Read.All');
  
  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&state=atomquest`;
  
  res.redirect(authUrl);
});

// Handle Microsoft Callback
router.get('/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      console.error('Microsoft OAuth Error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=microsoft_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code_provided`);
    }

    const tenant = process.env.ENTRA_TENANT_ID;
    const clientId = process.env.ENTRA_CLIENT_ID;
    const clientSecret = process.env.ENTRA_CLIENT_SECRET;
    const redirectUri = `http://localhost:5000/api/auth/entra/callback`;

    // 1. Exchange auth code for access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    // 2. Fetch User Profile
    const profileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    
    const profile = profileResponse.data;
    const email = (profile.mail || profile.userPrincipalName).toLowerCase();
    const firstName = profile.givenName || profile.displayName.split(' ')[0] || 'Unknown';
    const lastName = profile.surname || profile.displayName.split(' ').slice(1).join(' ') || 'Unknown';

    // 3. Fetch Manager
    let managerEmail = null;
    try {
      const managerResponse = await axios.get('https://graph.microsoft.com/v1.0/me/manager', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (managerResponse.data && (managerResponse.data.mail || managerResponse.data.userPrincipalName)) {
        managerEmail = (managerResponse.data.mail || managerResponse.data.userPrincipalName).toLowerCase();
      }
    } catch (err) {
      console.log(`Could not fetch manager for ${email} (might not have one).`);
    }

    // 4. Fetch Groups (for role mapping)
    // We will parse the Group IDs to roles. For now, if we don't have explicit Group IDs from the user, 
    // we default to employee. If they have specific roles we can map them later.
    let roles = ['employee'];
    try {
      const groupsResponse = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      // Future logic: map group object IDs to roles.
      // const groupIds = groupsResponse.data.value.map(g => g.id);
      // if (groupIds.includes('ADMIN_GROUP_ID')) roles.push('admin');
      // if (groupIds.includes('MANAGER_GROUP_ID')) roles.push('manager');
    } catch (err) {
      console.log(`Could not fetch groups for ${email}.`);
    }

    // 5. Database Sync
    // Find manager in our DB to get their ID
    let managerId = null;
    if (managerEmail) {
      const managerObj = await User.findOne({ email: managerEmail });
      if (managerObj) managerId = managerObj._id;
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user via SSO
      user = new User({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: 'SSO_USER_NO_PASSWORD', // We should allow this or generate a random complex password
        roles: roles,
        manager_id: managerId,
        is_first_login: false // Since SSO authenticates them
      });
      
      // Mongoose validation requires complex password, let's generate a strong dummy one
      user.password = `Sso!@#${Math.random().toString(36).slice(2)}${Date.now()}`;
      await user.save();
    } else {
      // Update existing user with Entra ID sync
      user.first_name = firstName;
      user.last_name = lastName;
      
      // Update manager if it changed
      if (managerId) user.manager_id = managerId;
      
      // Optionally update roles if we are actively mapping them
      // user.roles = roles;
      
      await user.save();
    }

    // 6. Generate local JWT and redirect to frontend
    const token = generateToken(user._id, user.email);
    
    // We pass the token and user data back to the frontend via URL parameters or a self-submitting form.
    // The easiest for a React SPA is redirecting to a specific frontend route with the token in query params.
    const encodedUser = encodeURIComponent(JSON.stringify(user.toJSON()));
    res.redirect(`${process.env.FRONTEND_URL}/login?sso_token=${token}&sso_user=${encodedUser}`);

  } catch (error) {
    console.error('SSO Callback Error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=sso_failed`);
  }
});

module.exports = router;
