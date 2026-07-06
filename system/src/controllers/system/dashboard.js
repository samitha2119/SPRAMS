// @desc    Update user status/role (Admin)
// @route   PUT /api/dashboard/users/:id
// @access  Admin only
const updateUser = async (req, res, next) => {
    try {
        const { role, isActive } = req.body;

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot modify your own account' });
        }

        const updates = {};
        if (role) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;

        // Atomic mongoose update operation
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await ActivityLog.create({
            userId: req.user._id,
            action: isActive === false ? 'USER_DEACTIVATED' : 'USER_UPDATED',
            target: `User: ${updatedUser.email} (${updatedUser._id})`,
        });

        res.json({ success: true, message: 'User updated', data: { user: updatedUser } });
    } catch (error) {
        next(error);
    }
};