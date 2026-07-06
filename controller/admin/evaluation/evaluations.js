const deleteEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found',
            });
        }

        await evaluation.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EVALUATION_DELETED',
            target: `Evaluation: ${req.params.id}`,
        });

        res.json({
            success: true,
            message: 'Evaluation deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};