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