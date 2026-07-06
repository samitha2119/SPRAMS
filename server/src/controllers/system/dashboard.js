const fs = require('fs');
const path = require('path');
const User = require('../../models/User');
const Project = require('../../models/Project');
const ResearchEntry = require('../../models/ResearchEntry');
const ActivityLog = require('../../models/ActivityLog');
const claudeService = require('../../services/claudeService');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Protected
const getDashboardStats = async (req, res, next) => {
    try {
        const role = req.user.role;
        const userId = req.user._id;

        if (role === 'admin') {
            const [totalUsers, totalProjects, totalResearch, recentActivity] = await Promise.all([
                User.countDocuments(),
                Project.countDocuments(),
                ResearchEntry.countDocuments(),
                ActivityLog.find().sort({ timestamp: -1 }).limit(20).populate('userId', 'name email role').lean(),
            ]);

            // Calculate storage used
            let storageBytes = 0;
            try {
                const uploadsDir = path.join(__dirname, '../../uploads');
                storageBytes = getFolderSize(uploadsDir);
            } catch {
                storageBytes = 0;
            }

            // User role breakdown
            const userRoles = await User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]);

            // Projects per department
            const projectsByDept = await Project.aggregate([
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]);

            return res.json({
                success: true,
                data: {
                    stats: {
                        totalUsers,
                        totalProjects,
                        totalResearch,
                        storageUsed: storageBytes,
                        storageUsedMB: Math.round(storageBytes / (1024 * 1024) * 100) / 100,
                    },
                    userRoles,
                    projectsByDept,
                    recentActivity,
                    researchStats: { lectureTotal: totalResearch, pendingTotal: 0 } // dummy for admin
                },
            });
        }

        if (role === 'lecturer') {
            const [lectureTotal, totalResearch, recentActivity] = await Promise.all([
                ResearchEntry.countDocuments({ authorId: userId }),
                ResearchEntry.countDocuments(),
                ActivityLog.find({ userId: userId }).sort({ timestamp: -1 }).limit(10).lean(),
            ]);

            return res.json({
                success: true,
                data: {
                    stats: {
                        totalResearch,
                        myResearch: lectureTotal,
                    },
                    researchStats: {
                        lectureTotal,
                        pendingTotal: 0, // No approval workflow in this version
                    },
                    recentActivity,
                },
            });
        }

        if (role === 'student') {
            const StudentResearch = require('../../models/StudentResearch');
            const [myProjects, totalProjects, myResearch, recentActivity] = await Promise.all([
                Project.countDocuments({ createdBy: userId }),
                Project.countDocuments(),
                StudentResearch.countDocuments({ submittedBy: userId }),
                ActivityLog.find({ userId: userId }).sort({ timestamp: -1 }).limit(10).lean(),
            ]);

            return res.json({
                success: true,
                data: {
                    stats: {
                        totalProjects,
                        myProjects,
                        myResearch
                    },
                    researchStats: {
                        submitted: myProjects + myResearch,
                        approved: myProjects + myResearch, // No approval workflow for now
                        points: (myProjects + myResearch) * 10, // 10 points per item
                    },
                    recentActivity,
                },
            });
        }

        res.status(400).json({ success: false, message: 'Invalid role' });
    } catch (error) {
        next(error);
    }
};

// Recursive folder size calculation
function getFolderSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    let total = 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            total += getFolderSize(fullPath);
        } else {
            total += stat.size;
        }
    }
    return total;
}

// @desc    Get all users (Admin)
// @route   GET /api/dashboard/users
// @access  Admin only
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.isActive !== undefined && req.query.isActive !== '') filter.isActive = req.query.isActive === 'true';
        if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status/role (Admin)
// @route   PUT /api/dashboard/users/:id
// @access  Admin only
const updateUser = async (req, res, next) => {
    try {
        const { role, isActive, approvalStatus } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot modify your own account' });
        }

        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        let approvedNow = false;
        let rejectedNow = false;
        if (approvalStatus) {
            const oldStatus = user.approvalStatus;
            user.approvalStatus = approvalStatus;
            if (approvalStatus === 'approved') {
                user.isActive = true;
                if (oldStatus !== 'approved') {
                    approvedNow = true;
                }
            } else if (approvalStatus === 'rejected') {
                if (oldStatus !== 'rejected') {
                    rejectedNow = true;
                }
            }
        }

        await user.save();

        if (approvedNow) {
            const { sendApprovalEmail } = require('../../utils/email');
            await sendApprovalEmail(user.email, user.name);
        }

        await ActivityLog.create({
            userId: req.user._id,
            action: approvedNow ? 'USER_APPROVED' : (rejectedNow ? 'USER_REJECTED' : (isActive === false ? 'USER_DEACTIVATED' : 'USER_UPDATED')),
            target: `User: ${user.email} (${user._id})`,
        });

        res.json({ success: true, message: approvedNow ? 'User approved and email sent' : (rejectedNow ? 'User rejected' : 'User updated'), data: { user } });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/dashboard/users/:id
// @access  Admin only
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        await user.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'USER_DELETED',
            target: `User: ${user.email} (${req.params.id})`,
        });

        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Improve abstract with AI
// @route   POST /api/dashboard/ai/improve-abstract
// @access  Admin/Lecturer
const improveAbstract = async (req, res, next) => {
    try {
        const { abstract } = req.body;
        if (!abstract || abstract.trim().length < 50) {
            return res.status(400).json({ success: false, message: 'Abstract must be at least 50 characters' });
        }

        const improved = await claudeService.improveAbstract(abstract);

        await ActivityLog.create({
            userId: req.user._id,
            action: 'AI_ABSTRACT_IMPROVED',
            target: `Abstract improvement requested`,
        });

        res.json({ success: true, data: { improved } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get activity logs
// @route   GET /api/dashboard/activity
// @access  Admin only
const getActivityLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.action) filter.action = req.query.action;
        if (req.query.userId) filter.userId = req.query.userId;

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('userId', 'name email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate abstract from keywords
// @route   POST /api/dashboard/ai/generate-abstract
// @access  Admin/Lecturer
const generateAbstract = async (req, res, next) => {
    try {
        const { title, keywords, department } = req.body;
        if (!title || !keywords) {
            return res.status(400).json({ success: false, message: 'Title and keywords are required' });
        }

        const generated = await claudeService.generateAbstract(title, keywords, department || 'General');

        await ActivityLog.create({
            userId: req.user._id,
            action: 'AI_ABSTRACT_GENERATED',
            target: `Prompt: ${title.substring(0, 50)}...`,
        });

        res.json({ success: true, data: { generated } });
    } catch (error) {
        next(error);
    }
};

// @desc    Suggest alternative titles
// @route   POST /api/dashboard/ai/suggest-titles
// @access  Admin/Lecturer
const suggestTitles = async (req, res, next) => {
    try {
        const { abstract, currentTitle } = req.body;
        if (!abstract) {
            return res.status(400).json({ success: false, message: 'Abstract is required for suggestions' });
        }

        const suggestions = await claudeService.suggestTitles(abstract, currentTitle || '');

        res.json({ success: true, data: { suggestions } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    updateUser,
    deleteUser,
    improveAbstract,
    getActivityLogs,
    generateAbstract,
    suggestTitles
};
