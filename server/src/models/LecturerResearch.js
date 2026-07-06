const mongoose = require('mongoose');

/**
 * LecturerResearch Schema
 * Separate model for lecturer's own research publications.
 * Shown ONLY on the Lecturer Dashboard — separate from student research.
 * Fields: Title, Abstract, Keywords, Co-Authors, Department, Year,
 * Publication/Journal info, attached research files
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

const lecturerResearchSchema = new mongoose.Schema(
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
        // Co-authors list
        coAuthors: {
            type: [String],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 20;
                },
                message: 'Cannot have more than 20 co-authors',
            },
        },
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
            maxlength: [150, 'Department cannot exceed 150 characters'],
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
            min: [2000, 'Year must be 2000 or later'],
            max: [2100, 'Year cannot exceed 2100'],
        },
        // Publication / Journal information
        publicationTitle: {
            type: String,
            trim: true,
            maxlength: [300, 'Publication title cannot exceed 300 characters'],
            default: '',
        },
        journalName: {
            type: String,
            trim: true,
            maxlength: [300, 'Journal name cannot exceed 300 characters'],
            default: '',
        },
        volume: {
            type: String,
            trim: true,
            maxlength: [50, 'Volume cannot exceed 50 characters'],
            default: '',
        },
        issueNumber: {
            type: String,
            trim: true,
            maxlength: [50, 'Issue number cannot exceed 50 characters'],
            default: '',
        },
        pages: {
            type: String,
            trim: true,
            maxlength: [50, 'Pages cannot exceed 50 characters'],
            default: '',
        },
        doi: {
            type: String,
            trim: true,
            maxlength: [200, 'DOI cannot exceed 200 characters'],
            default: '',
        },
        // URL to the publication
        publicationUrl: {
            type: String,
            trim: true,
            maxlength: [500, 'URL cannot exceed 500 characters'],
            default: '',
        },
        // Research data files
        files: {
            type: [researchFileSchema],
            default: [],
        },
        // Status
        status: {
            type: String,
            enum: {
                values: ['Draft', 'Submitted', 'Published', 'Archived'],
                message: 'Invalid status',
            },
            default: 'Draft',
        },
        // Lecturer who uploaded the research
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader is required'],
        },
    },
    {
        timestamps: true,
    }
);

// Text index for search
lecturerResearchSchema.index({
    title: 'text',
    abstract: 'text',
    keywords: 'text',
    department: 'text',
    journalName: 'text',
});
lecturerResearchSchema.index({ department: 1, year: -1 });
lecturerResearchSchema.index({ uploadedBy: 1 });
lecturerResearchSchema.index({ status: 1 });
lecturerResearchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LecturerResearch', lecturerResearchSchema);
