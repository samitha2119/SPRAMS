link: {
    type: String,
    trim: true,
    default: null,
},

relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
},

relatedModel: {
    type: String,
    enum: [
        'Project',
        'StudentResearch',
        'LecturerResearch',
        'Evaluation',
        'FormTemplate',
        null,
    ],
    default: null,
},