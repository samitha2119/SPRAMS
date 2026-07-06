// ProjectGroup Schema
const ProjectGroupSchema = new mongoose.Schema({
    projectGroupID: { type: String, required: true, unique: true },
    projectID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkspaceProject',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkspaceStudent',
        required: true
    }]
}, { timestamps: true });