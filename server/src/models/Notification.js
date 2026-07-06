const mongoose = require('mongoose');

/**
 * Notification Schema
 * In-app notification system for alerting users about:
 * - New submissions (lecturers get notified when students submit)
 * - Feedback/grades (students get notified when lecturers evaluate)
 * - System announcements (admin to all)
 * - Record additions
 */
const notificationSchema = new mongoose.Schema(
    {
        // Recipient user
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required'],
        },
        // Sender user (null for system notifications)
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Notification type for categorization and icon display
        type: {
            type: String,
            enum: {
                values: [
                    'NEW_SUBMISSION',      // Student submitted a project/research
                    'EVALUATION_RECEIVED', // Lecturer graded a submission
                    'STATUS_UPDATE',       // Project status changed
                    'NEW_FEEDBACK',        // Feedback added
                    'FORM_UPLOADED',       // New form template available
                    'SYSTEM_ANNOUNCEMENT', // Admin broadcast
                    'RECORD_ADDED',        // New record added to archive
                    'USER_ACTION',         // General user action
                    'APPROVAL_REQUEST',    // User registration pending approval
                ],
                message: 'Invalid notification type',
            },
            required: [true, 'Notification type is required'],
        },
        // Notification title (short)
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        // Notification message (detailed)
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        // Optional link to the related resource
        link: {
            type: String,
            trim: true,
            default: null,
        },
        // Reference to related entity
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        relatedModel: {
            type: String,
            enum: ['Project', 'StudentResearch', 'LecturerResearch', 'Evaluation', 'FormTemplate', null],
            default: null,
        },
        // Read status
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
