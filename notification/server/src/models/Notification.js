type: {
    type: String,
    enum: {
        values: [
            'NEW_SUBMISSION',
            'EVALUATION_RECEIVED',
            'STATUS_UPDATE',
            'NEW_FEEDBACK',
            'FORM_UPLOADED',
            'SYSTEM_ANNOUNCEMENT',
            'RECORD_ADDED',
            'USER_ACTION',
        ],
        message: 'Invalid notification type',
    },
    required: [true, 'Notification type is required'],
},