const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
} = require('../../controllers/system/notifications');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
