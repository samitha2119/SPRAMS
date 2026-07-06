const getEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id)
            .populate('evaluatedBy', 'name email');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found',
            });
        }

        res.json({
            success: true,
            data: { evaluation },
        });
    } catch (error) {
        next(error);
    }
};