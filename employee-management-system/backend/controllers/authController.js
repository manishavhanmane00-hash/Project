const User = require('../models/User');

// Simple token: base64-encoded user JSON (matches existing aiAuth pattern)
const makeToken = (user) =>
  Buffer.from(JSON.stringify({
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
  })).toString('base64');

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
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, designation, department } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    // First registered user becomes Admin
    const count = await User.countDocuments();
    const assignedRole = count === 0 ? 'Admin' : (role || 'Employee');

    const user = await User.create({
      name, email, password, // stored as plain text to match existing localStorage pattern
      role: assignedRole,
      designation: designation || '',
      department: department || '',
    });

    const token = makeToken(user);
    res.status(201).json({ success: true, token, user: safeUser(user), isFirstUser: count === 0 });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = makeToken(user);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    let user = await User.findOne({ email: email.toLowerCase() });
    let isNew = false;

    if (!user) {
      const count = await User.countDocuments();
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: `google_${googleId || Date.now()}`,
        role: count === 0 ? 'Admin' : 'Employee',
        googleId: googleId || null,
        avatar: avatar || null,
      });
      isNew = true;
    }

    const token = makeToken(user);
    res.json({ success: true, token, user: safeUser(user), isNew });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me  (requires protect middleware)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/me  (requires protect middleware)
const updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'city', 'state', 'country', 'designation', 'department', 'avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const token = makeToken(user);
    res.json({ success: true, message: 'Profile updated successfully', user: safeUser(user), token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.password !== currentPassword)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, googleLogin, getMe, updateMe, changePassword };
