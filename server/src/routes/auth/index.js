const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe, registerValidation, loginValidation } = require('../../controllers/auth/auth');
const { protect } = require('../../middleware/auth');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Admin can also register users with specific roles
router.post('/admin/register', protect, registerValidation, register);

module.exports = router;
