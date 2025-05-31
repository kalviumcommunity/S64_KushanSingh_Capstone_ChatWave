const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Signup Controller
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  // Validation: Ensure all fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if user already exists in the database
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create a new user
  const user = new User({ username, email, password });

  // Save user and handle errors
  try {
    await user.save();
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id), // JWT Token generation
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Login Controller
const login = async (req, res) => {
  const { username, email, password } = req.body;

  // Check if username or email is provided
  if (!username && !email) {
    return res.status(400).json({ message: 'Please provide either username or email' });
  }

  // Find user by username or email
  let user;
  if (username) {
    user = await User.findOne({ username });
  } else if (email) {
    user = await User.findOne({ email });
  }

  // If user not found or password doesn't match
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid username/email or password' });
  }

  // If authentication is successful, return the user data and token
  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id), // JWT Token generation
  });
};

module.exports = { signup, login };
