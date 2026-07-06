// Hash password before saving (Runs on .save() and .create())
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// NEW: Hash password before updating (Runs on findByIdAndUpdate / findOneAndUpdate)
userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    
    // Check if passwordHash is being modified in this update payload
    if (update.passwordHash) {
        try {
            const salt = await bcrypt.genSalt(12);
            update.passwordHash = await bcrypt.hash(update.passwordHash, salt);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword)