const express = require('express');
const router = express.Router();
const { authenticateJWT, refreshToken } = require('../middleware/auth');
const { registerUser, loginUser, changePassword, logoutUser } = require('../controllers/authController');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.patch('/:id/password', authenticateJWT, changePassword);
router.post('/logout', authenticateJWT, logoutUser);

module.exports = router;