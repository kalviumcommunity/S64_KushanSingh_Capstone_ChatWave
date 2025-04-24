const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (token && token.startsWith('Bearer ')) {
    const bearerToken = token.split(' ')[1]; // Extract the token

    try {
      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET); // Verify the token
      req.user = decoded; // Add user info to the request object
      next(); // Proceed to the next middleware/route handler
    } catch (err) {
      res.status(401).json({ message: 'Not authorized, token failed' }); // Token verification failed
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' }); // No token provided
  }
};

module.exports = authMiddleware;
