const createEvaluation = async (req, res, next) => {
    try {
        const {
            submissionId,
            submissionType,
            approvalStatus,
            marks,
            grade,
            feedback,
        } = req.body;

        // Verify submission
        let submission;

        if (submissionType === 'Project') {
            submission = await Project.findById(submissionId);
        } else if (submissionType === 'StudentResearch') {
            submission = await StudentResearch.findById(submissionId);
        }

        const evaluation = await Evaluation.create({
            submissionId,
            submissionType,
            evaluatedBy: req.user._id,
            approvalStatus: approvalStatus || 'Pending',
            marks: marks ?? null,
            grade: grade || 'N/A',
            feedback: feedback || '',
        });

        await Notification.create({
            recipientId:
                submissionType === 'Project'
                    ? submission.createdBy
                    : submission.submittedBy,
            senderId: req.user._id,
            type: 'EVALUATION_RECEIVED',
            title: 'New Evaluation',
            message: `Your ${
                submissionType === 'Project'
                    ? 'project'
                    : 'research'
            } "${submission.title}" has been evaluated.`,
            relatedId: evaluation._id,
            relatedModel: 'Evaluation',
        });

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EVALUATION_CREATED',
            target: `${submissionType}: ${submission.title}`,
        });

        res.status(201).json({
            success: true,
            data: { evaluation },
        });
    } catch (error) {
        next(error);
    }
};