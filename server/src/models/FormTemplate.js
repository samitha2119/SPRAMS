const mongoose = require('mongoose');

/**
 * FormTemplate Schema
 * Stores campus form templates uploaded by Admin.
 * These templates are visible ONLY on the Student Dashboard for download.
 * Supported file types: PDF, DOCX
 */
const formTemplateSchema = new mongoose.Schema(
    {
        // Display name of the template
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [200, 'Name cannot exceed 200 characters'],
        },
        // Brief description of the form template
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
            default: '',
        },
        // Category for organizing templates
        category: {
            type: String,
            trim: true,
            maxlength: [100, 'Category cannot exceed 100 characters'],
            default: 'General',
        },
        // Path to the uploaded file on disk/S3
        filePath: {
            type: String,
            required: [true, 'File path is required'],
        },
        // Original filename
        originalName: {
            type: String,
            required: [true, 'Original filename is required'],
            trim: true,
        },
        // MIME type (application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document)
        fileType: {
            type: String,
            required: [true, 'File type is required'],
            enum: {
                values: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                ],
                message: 'Only PDF and DOCX files are allowed for templates',
            },
        },
        // File size in bytes
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
            max: [52428800, 'Template file cannot exceed 50MB'],
        },
        // Admin who uploaded the template
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader is required'],
        },
        // Whether the template is currently active/visible
        isActive: {
            type: Boolean,
            default: true,
        },
        // Download count for analytics
        downloadCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
formTemplateSchema.index({ category: 1, isActive: 1 });
formTemplateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FormTemplate', formTemplateSchema);
