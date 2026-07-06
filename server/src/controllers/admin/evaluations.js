const Evaluation = require('../../models/Evaluation');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const Project = require('../../models/Project');
const StudentResearch = require('../../models/StudentResearch');

// @desc    Get evaluations for a submission
// @route   GET /api/v1/evaluations?submissionId=xxx&submissionType=Project
// @access  Private (all roles — students see their own evaluations)
const getEvaluations = async (req, res, next) => {
    try {
        const { submissionId, submissionType } = req.query;
        const filter = {};

        if (submissionId) filter.submissionId = submissionId;
        if (submissionType) filter.submissionType = submissionType;

        // Lecturers see their own evaluations
        if (req.user.role === 'lecturer') {
            filter.evaluatedBy = req.user._id;
        }

        // Students can only see evaluations of their own submissions
        if (req.user.role === 'student') {
            // Find the workspace student record to get registration number/name
            const Workspace = require('../../models/Workspace');
            const wsStudent = await Workspace.WorkspaceStudent.findById(req.user._id).lean();
            const studentRegNo = wsStudent?.registrationNumber || '';
            const studentName = req.user.name || wsStudent?.name || '';

            // Find projects where student is creator or group member
            const projectFilter = {
                $or: [
                    { createdBy: req.user._id }
                ]
            };
            if (studentRegNo) {
                projectFilter.$or.push({ 'members.regNo': studentRegNo });
            }
            if (studentName) {
                projectFilter.$or.push({ 'members.name': studentName });
            }

            const [projects, research] = await Promise.all([
                Project.find(projectFilter).select('_id').lean(),
                StudentResearch.find({ submittedBy: req.user._id }).select('_id').lean(),
            ]);
            const ownIds = [
                ...projects.map((p) => p._id.toString()),
                ...research.map((r) => r._id.toString()),
            ];
            
            if (submissionId) {
                if (!ownIds.includes(submissionId.toString())) {
                    return res.status(403).json({ success: false, message: "Access denied to this submission's evaluations" });
                }
                filter.submissionId = submissionId;
            } else {
                filter.submissionId = { $in: ownIds };
            }
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

// @desc    Get single evaluation
// @route   GET /api/v1/evaluations/:id
// @access  Private
const getEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id)
            .populate('evaluatedBy', 'name email');

        if (!evaluation) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }

        res.json({ success: true, data: { evaluation } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create evaluation (grade/mark a submission)
// @route   POST /api/v1/evaluations
// @access  Lecturer, Admin
const createEvaluation = async (req, res, next) => {
    try {
        const { submissionId, submissionType, approvalStatus, marks, grade, feedback } = req.body;

        if (!submissionId || !submissionType) {
            return res.status(400).json({
                success: false,
                message: 'submissionId and submissionType are required',
            });
        }

        // Verify submission exists
        let submission;
        if (submissionType === 'Project') {
            submission = await Project.findById(submissionId);
        } else if (submissionType === 'StudentResearch') {
            submission = await StudentResearch.findById(submissionId);
        }

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
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

        // Notify the submitter
        const submitterId =
            submissionType === 'Project' ? submission.createdBy : submission.submittedBy;

        await Notification.create({
            recipientId: submitterId,
            senderId: req.user._id,
            type: 'EVALUATION_RECEIVED',
            title: 'New Evaluation',
            message: `Your ${submissionType === 'Project' ? 'project' : 'research'} "${submission.title}" has been evaluated.`,
            relatedId: evaluation._id,
            relatedModel: 'Evaluation',
            link: submissionType === 'Project'
                ? `/projects/${submissionId}`
                : `/research/${submissionId}`,
        });

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EVALUATION_CREATED',
            target: `${submissionType}: ${submission.title} — ${approvalStatus || 'Pending'}`,
        });

        const populated = await evaluation.populate('evaluatedBy', 'name email');
        res.status(201).json({
            success: true,
            message: 'Evaluation submitted successfully',
            data: { evaluation: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update evaluation
// @route   PUT /api/v1/evaluations/:id
// @access  Lecturer (own), Admin
const updateEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }

        // Only the evaluator or admin can update
        if (
            req.user.role !== 'admin' &&
            evaluation.evaluatedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this evaluation' });
        }

        const { approvalStatus, marks, grade, feedback } = req.body;
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

        const populated = await evaluation.populate('evaluatedBy', 'name email');
        res.json({
            success: true,
            message: 'Evaluation updated successfully',
            data: { evaluation: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete evaluation
// @route   DELETE /api/v1/evaluations/:id
// @access  Admin only
const deleteEvaluation = async (req, res, next) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);
        if (!evaluation) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }

        await evaluation.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EVALUATION_DELETED',
            target: `Evaluation: ${req.params.id}`,
        });

        res.json({ success: true, message: 'Evaluation deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvaluations,
    getEvaluation,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
};
