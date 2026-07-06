const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
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
            enum: {
                values: ['application/pdf', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'video/mp4'],
                message: 'Only PDF, JPG, PNG, MP3, WAV, and MP4 files are allowed',
            },
        },
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
            max: [1073741824, 'File cannot exceed 1GB'],
        },
        category: {
            type: String,
            enum: ['pdf', 'image', 'audio', 'video'],
            required: true,
        },
    },
    { _id: true }
);

const researchEntrySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Research title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters'],
            maxlength: [300, 'Title cannot exceed 300 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [20, 'Description must be at least 20 characters'],
            maxlength: [10000, 'Description cannot exceed 10000 characters'],
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        department: {
            type: String,
            trim: true,
            default: 'IT'
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
            min: [2000, 'Year must be 2000 or later'],
            max: [2100, 'Year cannot exceed 2100'],
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 20;
                },
                message: 'Cannot have more than 20 tags',
            },
        },
        files: {
            type: [fileSchema],
            default: [],
        },
        aiSummary: {
            type: String,
            trim: true,
            maxlength: [2000, 'AI Summary cannot exceed 2000 characters'],
            default: null,
        },
        aiSummaryGeneratedAt: {
            type: Date,
            default: null,
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
    },
    {
        timestamps: true,
    }
);

// Text index for search
researchEntrySchema.index({
    title: 'text',
    description: 'text',
    aiSummary: 'text',
    tags: 'text',
});
researchEntrySchema.index({ year: -1, createdAt: -1 });
researchEntrySchema.index({ authorId: 1 });

module.exports = mongoose.model('ResearchEntry', researchEntrySchema);
