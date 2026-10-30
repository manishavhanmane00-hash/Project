const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User   = require('../models/User');

/**
 * Sign a JWT for the given user document.
 * The token contains only the user ID — nothing sensitive.
 * All other user info is re-read from the DB on each request via the protect middleware.
 */
const signToken = (user) =>
  jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Safe public user representation — password hash is never included.
 */
const safeUser = (user) => ({
  id:          user._id.toString(),
  name:        user.name,
  email:       user.email,
  role:        user.role,
  designation: user.designation,
  department:  user.department,
  phone:       user.phone,
  address:     user.address,
  city:        user.city,
  state:       user.state,
  country:     user.country,
  avatar:      user.avatar,
  isActive:    user.isActive,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, designation, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // The first user ever registered becomes Admin; all subsequent public registrations are Employee.
    // This prevents privilege escalation — clients CANNOT set their own role.
    const count = await User.countDocuments();
    const assignedRole = count === 0 ? 'Admin' : 'Employee';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,   // hashed by pre-save hook
      role: assignedRole,
      designation: designation || '',
      department:  department  || '',
    });

    // Re-fetch to get clean document without password
    const created = await User.findById(user._id).select('-password');
    const token = signToken(created);

    res.status(201).json({
      success: true,
      token,
      user: safeUser(created),
      isFirstUser: count === 0,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Explicitly select password (it has select: false in schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      // Return same message for unknown email and wrong password — prevents email enumeration
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google   (Google OAuth — server-side ID token verification)
//
// Security model:
//   The frontend sends the Google ID token (credential) obtained from the
//   official Google Identity Services flow. We NEVER trust email/name/ID
//   supplied independently by the client — we verify the token server-side
//   using google-auth-library, checking signature, audience, issuer, and
//   expiry. Only then do we extract the verified identity.
//
// Account-linking policy:
//   1. If a user already has this googleId linked → authenticate.
//   2. If an existing user has the same verified email and no googleId
//      yet → link the Google identity to that account.
//   3. If an existing user has the same email but a DIFFERENT googleId
//      → reject (do not silently merge).
//   4. No existing user → create a new Employee account (never Admin).
// ─────────────────────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_web_client_id_here') {
      console.error('[Google Auth] GOOGLE_CLIENT_ID is not configured on the backend.');
      return res.status(500).json({ success: false, message: 'Google sign-in is not configured on the server. Ask an administrator to set GOOGLE_CLIENT_ID.' });
    }

    // ── Verify the Google ID token server-side ────────────────────────────
    let payload;
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,  // ensure the token was issued for OUR client ID
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[Google Auth] Token verification failed:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Google sign-in could not be verified. The token may be invalid or expired. Please try again.',
      });
    }

    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token.' });
    }

    // Google guarantees these fields in a valid ID token
    const googleSub  = payload.sub;             // stable Google subject ID
    const email      = (payload.email || '').toLowerCase().trim();
    const name       = payload.name || (email ? email.split('@')[0] : 'Google User');
    const avatar     = payload.picture || null;
    const emailVerified = payload.email_verified === true;

    if (!googleSub || !email) {
      return res.status(400).json({ success: false, message: 'Google token is missing required identity fields.' });
    }

    // Require a verified email before allowing account creation or linking
    if (!emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your Google account email is not verified. Please verify your email with Google before signing in.',
      });
    }

    // ── Account lookup & linking ──────────────────────────────────────────
    let user = await User.findOne({ googleId: googleSub });
    let isNew = false;

    if (user) {
      // Case 1: Google identity already linked — authenticate.
    } else {
      // Look up by email to attempt account linking
      const existingByEmail = await User.findOne({ email });

      if (existingByEmail) {
        // Case 3: email belongs to an account that already has a different googleId → reject
        if (existingByEmail.googleId && existingByEmail.googleId !== googleSub) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email is already linked to a different Google account. Please use the original Google account or sign in with your password.',
          });
        }
        // Case 2: existing account with same verified email, no googleId yet → link
        existingByEmail.googleId = googleSub;
        if (avatar && !existingByEmail.avatar) existingByEmail.avatar = avatar;
        await existingByEmail.save();
        user = existingByEmail;
      } else {
        // Case 4: no existing user — create a new Employee account (never Admin)
        const randomPwd = require('crypto').randomBytes(32).toString('hex');
        user = await User.create({
          name: name.trim(),
          email,
          password: randomPwd,   // hashed by pre-save hook; Google users never use it
          role: 'Employee',      // public Google sign-in can NEVER create Admin
          googleId: googleSub,
          avatar,
          isActive: true,
        });
        isNew = true;
      }
    }

    // Reject deactivated accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Issue our own JWT — same as email/password login
    const token = signToken(user);
    res.json({ success: true, token, user: safeUser(user), isNew });
  } catch (err) {
    console.error('[Google Auth] Error:', err.message);
    res.status(500).json({ success: false, message: 'Google sign-in failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me   (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/me   (requires protect middleware)
// Only allows updating safe profile fields — role, isActive, password
// are NOT in the allow-list and cannot be changed through this endpoint.
// ─────────────────────────────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const ALLOWED = ['name', 'phone', 'address', 'city', 'state', 'country', 'avatar', 'designation', 'department'];
    const updates = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const token = signToken(user);
    res.json({ success: true, message: 'Profile updated successfully', user: safeUser(user), token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password  (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Explicitly select password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Returns a generic success response regardless of whether email exists
// to prevent email enumeration.
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  // In a production deployment this would send an email with a time-limited token.
  // For this self-hosted version we return a safe acknowledgement.
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link will be sent shortly.',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin: toggle user active/inactive
// PUT /api/auth/users/:id/status  (adminOnly)
// ─────────────────────────────────────────────────────────────────────────────
const setUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) is required' });
    }

    // Prevent an admin from deactivating their own account
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register, login, googleLogin,
  getMe, updateMe, changePassword,
  forgotPassword, setUserStatus,
};
