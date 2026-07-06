const getEvaluations = async (req, res, next) => {
    try {
        const { submissionId, submissionType } = req.query;
        const filter = {};

        if (submissionId) filter.submissionId = submissionId;
        if (submissionType) filter.submissionType = submissionType;

        if (req.user.role === 'lecturer') {
            filter.evaluatedBy = req.user._id;
        }

        if (req.user.role === 'student') {
            const [projects, research] = await Promise.all([
                Project.find({ createdBy: req.user._id }).select('_id').lean(),
                StudentResearch.find({ submittedBy: req.user._id }).select('_id').lean(),
            ]);

            const ownIds = [
                ...projects.map((p) => p._id),
                ...research.map((r) => r._id),
            ];

            filter.submissionId = { $in: ownIds };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [evaluations, total] = await Promise.all([
            Evaluation.find(filter)
                .populate('evaluatedBy', 'name email')
                .sort({ evaluationDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Evaluation.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                evaluations,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};