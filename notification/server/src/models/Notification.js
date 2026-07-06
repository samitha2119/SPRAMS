notificationSchema.index({
    recipientId: 1,
    isRead: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipientId: 1,
    createdAt: -1,
});

notificationSchema.index({
    type: 1,
});