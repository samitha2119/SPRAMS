const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'lecturer', 'student'],
                message: 'Role must be admin, lecturer, or student',
            },
            default: 'student',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        approvalStatus: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: 'Approval status must be pending, approved, or rejected',
            },
            default: 'pending',
        },
        refreshToken: {
            type: String,
            select: false,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.refreshToken;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
