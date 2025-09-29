const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { getAllUsers, getUserProfile, updateUserProfile } = require('../controllers/userController');

// User routes
router.get('/', getAllUsers);
router.get('/:id', getUserProfile);
router.patch('/:id', authenticateJWT, updateUserProfile);

module.exports = router;