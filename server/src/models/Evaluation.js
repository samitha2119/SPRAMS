const mongoose = require('mongoose');

/**
 * Evaluation Schema
 * Stores grades, marks, and feedback given by lecturers for student projects/research.
 * Links to the submission (project or research) and the evaluating lecturer.
 */
const evaluationSchema = new mongoose.Schema(
    {
        // Reference to the submission being evaluated
        submissionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Submission reference is required'],
            refPath: 'submissionType',
        },
        // Polymorphic reference — either 'Project' or 'StudentResearch'
        submissionType: {
            type: String,
            required: [true, 'Submission type is required'],
            enum: {
                values: ['Project', 'StudentResearch'],
                message: 'Submission type must be Project or StudentResearch',
            },
        },
        // Lecturer who performed the evaluation
        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Evaluator (lecturer) is required'],
        },
        // Approval status set by lecturer
        approvalStatus: {
            type: String,
            enum: {
                values: ['Approved', 'Rejected', 'Revision Required', 'Pending'],
                message: 'Invalid approval status',
            },
            default: 'Pending',
        },
        // Numeric marks (0-100)
        marks: {
            type: Number,
            min: [0, 'Marks cannot be negative'],
            max: [100, 'Marks cannot exceed 100'],
            default: null,
        },
        // Letter grade
        grade: {
            type: String,
            enum: {
                values: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'N/A'],
                message: 'Invalid grade value',
            },
            default: 'N/A',
        },
        // Written feedback from the lecturer
        feedback: {
            type: String,
            trim: true,
            maxlength: [5000, 'Feedback cannot exceed 5000 characters'],
            default: '',
        },
        // Date of evaluation
        evaluationDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
evaluationSchema.index({ submissionId: 1, submissionType: 1 });
evaluationSchema.index({ evaluatedBy: 1 });
evaluationSchema.index({ approvalStatus: 1 });
evaluationSchema.index({ evaluationDate: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
