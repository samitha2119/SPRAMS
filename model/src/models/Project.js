const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Member name is required'],
            trim: true,
            maxlength: [100, 'Member name cannot exceed 100 characters'],
        },
        regNo: {
            type: String,
            required: [true, 'Registration number is required'],
            trim: true,
            maxlength: [50, 'Registration number cannot exceed 50 characters'],
        },
    },
    { _id: false }
);

const projectFileSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        filePath: {
            type: String,
            required: [true, 'File path is required'],
        },
        fileType: {
            type: String,
            required: [true, 'File type is required'],
        },
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
            max: [1073741824, 'File cannot exceed 1GB'],
        },
        category: {
            type: String,
            enum: ['pdf', 'document', 'image', 'audio', 'video', 'dataset', 'archive', 'other'],
            required: true,
        },
    },
    { _id: true }
);

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters'],
            maxlength: [300, 'Title cannot exceed 300 characters'],
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
            maxlength: [150, 'Department cannot exceed 150 characters'],
        },
        academicYear: {
            type: String,
            required: [true, 'Academic year is required'],
            trim: true,
            match: [/^\d{4}\/\d{4}$/, 'Academic year must be in format YYYY/YYYY (e.g. 2023/2024)'],
        },
        groupName: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true,
            maxlength: [100, 'Group name cannot exceed 100 characters'],
        },
        supervisor: {
            type: String,
            required: [true, 'Supervisor name is required'],
            trim: true,
            maxlength: [150, 'Supervisor name cannot exceed 150 characters'],
        },
        abstract: {
            type: String,
            required: [true, 'Abstract is required'],
            trim: true,
            minlength: [50, 'Abstract must be at least 50 characters'],
            maxlength: [5000, 'Abstract cannot exceed 5000 characters'],
        },
        members: {
            type: [memberSchema],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 20;
                },
                message: 'A project cannot have more than 20 members',
            },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator is required'],
        },
        githubLink: {
            type: String,
            trim: true,
            maxlength: [500, 'GitHub link cannot exceed 500 characters'],
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?github\.com\/.+/i.test(v);
                },
                message: 'Must be a valid GitHub URL (e.g. https://github.com/user/repo)',
            },
        },
        status: {
            type: String,
            enum: {
                values: ['Proposed', 'Ongoing', 'Completed'],
                message: 'Invalid status',
            },
            default: 'Proposed',
        },
        proposalFile: {
            originalName: { type: String, trim: true },
            filePath: { type: String },
            fileType: { type: String, default: 'application/pdf' },
            fileSize: { type: Number }
        },
        finalReportFile: {
            originalName: { type: String, trim: true },
            filePath: { type: String },
            fileType: { type: String, default: 'application/pdf' },
            fileSize: { type: Number }
        },
        files: {
            type: [projectFileSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Text index for search
projectSchema.index({ title: 'text', abstract: 'text', department: 'text', groupName: 'text' });
projectSchema.index({ department: 1, academicYear: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
