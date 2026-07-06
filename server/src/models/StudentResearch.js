const mongoose = require('mongoose');

/**
 * StudentResearch Schema
 * Separate model for student research submissions.
 * Fields: Title, Abstract, Keywords, Department, Academic Year,
 * Researcher(s), Supervisor, Publication DOI (optional),
 * Research Data files (audio, video, documents, biological/medical datasets with ethical note)
 */

const researchFileSchema = new mongoose.Schema(
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

const studentResearchSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Research title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters'],
            maxlength: [300, 'Title cannot exceed 300 characters'],
        },
        abstract: {
            type: String,
            required: [true, 'Abstract is required'],
            trim: true,
            minlength: [50, 'Abstract must be at least 50 characters'],
            maxlength: [5000, 'Abstract cannot exceed 5000 characters'],
        },
        keywords: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 20;
                },
                message: 'Cannot have more than 20 keywords',
            },
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
        // Array of researcher names
        researchers: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 10;
                },
                message: 'Cannot have more than 10 researchers',
            },
        },
        supervisor: {
            type: String,
            required: [true, 'Supervisor name is required'],
            trim: true,
            maxlength: [150, 'Supervisor name cannot exceed 150 characters'],
        },
        // Optional publication DOI
        publicationDOI: {
            type: String,
            trim: true,
            maxlength: [200, 'DOI cannot exceed 200 characters'],
            default: '',
        },
        // Ethical note for biological/medical datasets
        ethicalNote: {
            type: String,
            trim: true,
            maxlength: [2000, 'Ethical note cannot exceed 2000 characters'],
            default: '',
        },
        // Research data files
        files: {
            type: [researchFileSchema],
            default: [],
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
        // Status tracking
        status: {
            type: String,
            enum: {
                values: ['Proposed', 'Approved', 'Ongoing', 'Completed', 'Unfinished'],
                message: 'Invalid status',
            },
            default: 'Proposed',
        },
        // Student who submitted the research
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Submitter is required'],
        },
    },
    {
        timestamps: true,
    }
);

// Text index for search
studentResearchSchema.index({
    title: 'text',
    abstract: 'text',
    keywords: 'text',
    department: 'text',
});
studentResearchSchema.index({ department: 1, academicYear: 1 });
studentResearchSchema.index({ submittedBy: 1 });
studentResearchSchema.index({ status: 1 });
studentResearchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudentResearch', studentResearchSchema);
