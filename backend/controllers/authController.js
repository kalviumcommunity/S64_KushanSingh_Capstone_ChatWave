const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Signup Controller
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: 'User already exists' });

  const user = await User.create({ username, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
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

  // If user is found and password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid username/email or password' });
  }
};

module.exports = { signup, login };
