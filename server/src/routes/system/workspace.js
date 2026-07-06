const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { WorkspaceStudent, WorkspaceProject, WorkspaceProjectGroup, WorkspaceSubmission, WorkspaceEvaluation } = require('../../models/Workspace');
const { protect } = require('../../middleware/auth');

// Configure upload middleware
const upload = require('../../middleware/upload'); // Uses the project's existing upload middleware config if available, or fallback to multer local destination
const uploadLocal = multer({
    dest: 'uploads/submissions/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB Limit
});

/**
 * @route   GET /api/v1/workspace
 * @desc    Fetch active project, team members, submissions, and evaluations for the logged-in student
 * @access  Private
 */
router.get('/', protect, async (req, res, next) => {
    try {
        // Find student in DB matching the logged-in user's ObjectId
        const student = await WorkspaceStudent.findById(req.user._id);
        if (!student) {
            return res.status(200).json({
                success: true,
                message: 'No active student workspace found.',
                data: { project: null, groupMembers: [], submissions: [], evaluations: [] }
            });
        }

        // Find the group link to get the project
        const group = await WorkspaceProjectGroup.findOne({ students: student._id })
            .populate('projectID')
            .populate('students', 'studentID registrationNumber name');

        if (!group || !group.projectID) {
            return res.status(200).json({
                success: true,
                message: 'No active project group found.',
                data: { project: null, groupMembers: [], submissions: [], evaluations: [] }
            });
        }

        const project = group.projectID;

        // Fetch all submissions and evaluations matching the ProjectID
        const submissions = await WorkspaceSubmission.find({ projectID: project._id })
            .populate('submittedBy', 'name registrationNumber')
            .sort({ createdAt: -1 });

        const evaluations = await WorkspaceEvaluation.find({ projectID: project._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                project,
                groupMembers: group.students,
                submissions,
                evaluations
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/v1/workspace/submissions
 * @desc    Handle document upload with auto-incrementing version control logic
 * @access  Private
 */
router.post('/submissions', protect, uploadLocal.single('file'), async (req, res, next) => {
    try {
        const { projectID, submissionType } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file.' });
        }

        // Resolve database documents
        const project = await WorkspaceProject.findById(projectID);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found.' });
        }

        const student = await WorkspaceStudent.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student record not found in workspace.' });
        }

        // --- Iterative Version Control Logic ---
        // 1. Filter existing submissions by the specific project and submission type
        const existingSubmissions = await WorkspaceSubmission.find({
            projectID: project._id,
            submissionType: submissionType
        });

        // 2. Count the existing versions and auto-increment the version number integer by 1
        const versionNumber = existingSubmissions.length + 1;

        // 3. Save new entry
        const newSubmission = await WorkspaceSubmission.create({
            submissionID: crypto.randomUUID(),
            projectID: project._id,
            submissionType,
            filePath: req.file.path,
            originalName: req.file.originalname,
            submittedBy: student._id,
            versionNumber
        });

        res.status(201).json({
            success: true,
            message: `Submission ${submissionType} (v${versionNumber}) uploaded successfully!`,
            data: newSubmission
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/v1/workspace/download/:submissionId
 * @desc    Download submission file attachment
 * @access  Private
 */
router.get('/download/:submissionId', protect, async (req, res, next) => {
    try {
        const { submissionId } = req.params;
        const submission = await WorkspaceSubmission.findOne({ submissionID: submissionId });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission file not found.' });
        }

        const normalizePath = (p) => path.resolve(p).replace(/\\/g, '/');
        const resolvedPath = path.resolve(submission.filePath);
        const uploadsDir = normalizePath(path.join(__dirname, '../../../uploads'));
        const normalizedResolved = normalizePath(resolvedPath);

        if (!normalizedResolved.startsWith(uploadsDir)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ success: false, message: 'File not found on server storage.' });
        }

        res.download(resolvedPath, submission.originalName);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
