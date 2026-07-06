const updateEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation not found',
            });
        }

        const {
            approvalStatus,
            marks,
            grade,
            feedback,
        } = req.body;

        if (approvalStatus) evaluation.approvalStatus = approvalStatus;
        if (marks !== undefined) evaluation.marks = marks;
        if (grade) evaluation.grade = grade;
        if (feedback !== undefined) evaluation.feedback = feedback;

        evaluation.evaluationDate = new Date();

        await evaluation.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EVALUATION_UPDATED',
            target: `Evaluation: ${evaluation._id}`,
        });

        res.json({
            success: true,
            data: { evaluation },
        });
    } catch (error) {
        next(error);
    }
};