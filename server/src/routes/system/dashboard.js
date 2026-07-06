const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getUsers,
    updateUser,
    deleteUser,
    improveAbstract,
    getActivityLogs,
    generateAbstract,
    suggestTitles
} = require('../../controllers/system/dashboard');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Dashboard Stats (All roles)
router.get('/stats', getDashboardStats);

// Admin only
router.get('/activity', authorize('admin'), getActivityLogs);
router.route('/users')
    .get(authorize('admin'), getUsers);
router.route('/users/:id')
    .put(authorize('admin'), updateUser)
    .delete(authorize('admin'), deleteUser);

// AI Tools (Admin & Lecturers)
router.post('/ai/improve-abstract', authorize('admin', 'lecturer'), improveAbstract);
router.post('/ai/generate-abstract', authorize('admin', 'lecturer'), generateAbstract);
router.post('/ai/suggest-titles', authorize('admin', 'lecturer'), suggestTitles);

module.exports = router;
