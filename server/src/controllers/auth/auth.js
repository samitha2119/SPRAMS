const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const { generateAccessToken, generateRefreshToken } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/errorHandler');

// Validation rules for registration
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('email').normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'lecturer', 'student']).withMessage('Role must be admin, lecturer, or student'),
    handleValidationErrors,
];

// Validation rules for login
const loginValidation = [
    body('email').normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (admin can create any role; public can only create students)
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Only admins can set role to admin or lecturer
        const assignedRole = role || 'student';
        if ((assignedRole === 'admin' || assignedRole === 'lecturer') && (!req.user || req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Only admins can create admin or lecturer accounts' });
        }

        const isCreatedByAdmin = req.user && req.user.role === 'admin';
        const approvalStatus = isCreatedByAdmin ? 'approved' : 'pending';

        const user = await User.create({
            name,
            email,
            passwordHash: password,
            role: assignedRole,
            approvalStatus,
        });

        if (approvalStatus === 'pending') {
            // Send notification to all admin users
            const Notification = require('../../models/Notification');
            const admins = await User.find({ role: 'admin' });
            
            for (const admin of admins) {
                await Notification.create({
                    recipientId: admin._id,
                    senderId: user._id,
                    type: 'APPROVAL_REQUEST',
                    title: 'New Registration Request',
                    message: `${name} (${email}) has registered and is pending approval.`,
                    link: '/admin/users',
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Registration submitted successfully. Your account is pending administrator approval.',
                data: {
                    user: user.toJSON(),
                    pendingApproval: true,
                },
            });
        }

        // Log activity if admin created user
        if (isCreatedByAdmin) {
            await ActivityLog.create({
                userId: req.user._id,
                action: 'USER_CREATED',
                target: `User: ${email} (${assignedRole})`,
            });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await User.findByIdAndUpdate(user._id, { refreshToken });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+passwordHash +refreshToken');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (user.approvalStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is pending approval by an administrator.' });
        }

        if (user.approvalStatus === 'rejected') {
            return res.status(403).json({ success: false, message: 'Your registration request has been rejected. Contact admin.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Store refresh token and update last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        // Log login activity
        await ActivityLog.create({
            userId: user._id,
            action: 'LOGIN',
            target: `User: ${email}`,
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (with valid refresh token)
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        if (user.approvalStatus !== 'approved') {
            return res.status(403).json({ success: false, message: 'Account is not approved' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
    try {
        // Invalidate refresh token
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

        await ActivityLog.create({
            userId: req.user._id,
            action: 'LOGOUT',
            target: `User: ${req.user.email}`,
        });

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, refresh, logout, getMe, registerValidation, loginValidation };
