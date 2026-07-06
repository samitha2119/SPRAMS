// Submission Schema
const SubmissionSchema = new mongoose.Schema({
    submissionID: { type: String, required: true, unique: true },
    projectID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkspaceProject',
        required: true
    },
    submissionType: {
        type: String,
        required: true,
        enum: ['Proposal', 'Progress Report', 'Final Report']
    },
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkspaceStudent',
        required: true
    },
    versionNumber: { type: Number, required: true }
}, { timestamps: true });