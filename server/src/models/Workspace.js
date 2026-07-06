const mongoose = require('mongoose');

// Student Schema
const StudentSchema = new mongoose.Schema({
    studentID: { type: String, required: true, unique: true },
    registrationNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true }
}, { timestamps: true });

// Project Schema
const WorkspaceProjectSchema = new mongoose.Schema({
    projectID: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['Proposed', 'Approved', 'Ongoing', 'Completed'],
        default: 'Proposed'
    }
}, { timestamps: true });

// ProjectGroup Schema (Links multiple Students to one Project)
const ProjectGroupSchema = new mongoose.Schema({
    projectGroupID: { type: String, required: true, unique: true },
    projectID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceStudent', required: true }]
}, { timestamps: true });

// Submission Schema (Iterative Deliverables)
const SubmissionSchema = new mongoose.Schema({
    submissionID: { type: String, required: true, unique: true },
    projectID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
    submissionType: {
        type: String,
        required: true,
        enum: ['Proposal', 'Progress Report', 'Final Report']
    },
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceStudent', required: true },
    versionNumber: { type: Number, required: true }
}, { timestamps: true });

// Evaluation Schema (Supervisor Critique & Grades)
const EvaluationSchema = new mongoose.Schema({
    evaluationID: { type: String, required: true, unique: true },
    projectID: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true },
    marks: { type: Number, min: 0, max: 100, default: null },
    feedback: { type: String, required: true },
    gradedBy: { type: String, required: true } // Supervisor Name
}, { timestamps: true });

module.exports = {
    WorkspaceStudent: mongoose.model('WorkspaceStudent', StudentSchema),
    WorkspaceProject: mongoose.model('WorkspaceProject', WorkspaceProjectSchema),
    WorkspaceProjectGroup: mongoose.model('WorkspaceProjectGroup', ProjectGroupSchema),
    WorkspaceSubmission: mongoose.model('WorkspaceSubmission', SubmissionSchema),
    WorkspaceEvaluation: mongoose.model('WorkspaceEvaluation', EvaluationSchema)
};
