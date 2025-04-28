const express = require('express');
const { signup, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Import the authentication middleware

const router = express.Router();

// POST /signup - Register a new user
router.post('/signup', signup);

// POST /login - Login a user and issue JWT
router.post('/login', login);

// Protected route (Example) - You can add more routes that require authentication
router.get('/profile', authMiddleware, (req, res) => {
  // This route will be protected by JWT authentication
  res.json({
    message: "This is a protected route, you're authenticated!",
    user: req.user, // The user data attached by the authMiddleware
  });
});

module.exports = router;
