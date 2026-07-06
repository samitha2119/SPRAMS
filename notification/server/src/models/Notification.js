recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
},

senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
},