const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            trim: true,
            maxlength: [200, 'Action cannot exceed 200 characters'],
            enum: [
                'USER_CREATED',
                'USER_UPDATED',
                'USER_DELETED',
                'USER_ACTIVATED',
                'USER_DEACTIVATED',
                'USER_APPROVED',
                'USER_REJECTED',
                'PROJECT_CREATED',
                'PROJECT_UPDATED',
                'PROJECT_DELETED',
                'PROJECT_MEMBER_ADDED',
                'PROJECT_MEMBER_REMOVED',
                'RESEARCH_CREATED',
                'RESEARCH_UPDATED',
                'RESEARCH_DELETED',
                'STUDENT_RESEARCH_CREATED',
                'STUDENT_RESEARCH_UPDATED',
                'STUDENT_RESEARCH_DELETED',
                'FILE_UPLOADED',
                'FILE_DELETED',
                'AI_SUMMARY_GENERATED',
                'AI_ABSTRACT_IMPROVED',
                'EXPORT_CSV',
                'LOGIN',
                'LOGOUT',
            ],
        },
        target: {
            type: String,
            required: [true, 'Target is required'],
            trim: true,
            maxlength: [500, 'Target cannot exceed 500 characters'],
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
