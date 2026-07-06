const Notification = require('../../models/Notification');

// @desc    Get notifications for the current user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { recipientId: req.user._id };
        if (req.query.unreadOnly === 'true') {
            filter.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .populate('senderId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipientId: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipientId: req.user._id,
            isRead: false,
        });

        res.json({ success: true, data: { count, unreadCount: count } });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipientId: req.user._id,
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
};
