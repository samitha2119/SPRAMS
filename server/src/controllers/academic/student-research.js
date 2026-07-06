const fs = require('fs');
const StudentResearch = require('../../models/StudentResearch');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { getFileCategory } = require('../../middleware/upload');
const claudeService = require('../../services/claudeService');

// @desc    Get all student research entries (paginated)
// @route   GET /api/v1/student-research
// @access  Private (all roles)
const getStudentResearch = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
        if (req.query.academicYear) filter.academicYear = req.query.academicYear;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.keyword) {
            filter.keywords = { $in: [req.query.keyword] };
        }

        if (req.query.submittedBy) {
            filter.submittedBy = req.query.submittedBy;
        }

        // Students see all research submissions in database (restriction removed)

        const [entries, total] = await Promise.all([
            StudentResearch.find(filter)
                .populate('submittedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StudentResearch.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                entries,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page < Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single student research
// @route   GET /api/v1/student-research/:id
// @access  Private
const getStudentResearchById = async (req, res, next) => {
    try {
        const entry = await StudentResearch.findById(req.params.id)
            .populate('submittedBy', 'name email');

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Student research not found' });
        }

        res.json({ success: true, data: { entry } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create student research
// @route   POST /api/v1/student-research
// @access  Student, Admin
const createStudentResearch = async (req, res, next) => {
    try {
        const {
            title, abstract, keywords, department, academicYear,
            researchers, supervisor, publicationDOI, ethicalNote,
        } = req.body;

        let parsedKeywords = [];
        if (keywords) {
            parsedKeywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        }

        let parsedResearchers = [];
        if (researchers) {
            parsedResearchers = typeof researchers === 'string' ? JSON.parse(researchers) : researchers;
        }

        let files = [];
        if (req.files && req.files['files']) {
            files = req.files['files'].map((file) => ({
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                category: getFileCategory(file.mimetype),
            }));
        }

        if (!req.files || !req.files['proposal'] || !req.files['proposal'][0]) {
            return res.status(400).json({ success: false, message: 'Research proposal PDF file is required' });
        }

        let proposalFile = undefined;
        if (req.files && req.files['proposal'] && req.files['proposal'][0]) {
            const file = req.files['proposal'][0];
            proposalFile = {
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
            };
        }

        let finalReportFile = undefined;
        if (req.files && req.files['finalReport'] && req.files['finalReport'][0]) {
            const file = req.files['finalReport'][0];
            finalReportFile = {
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
            };
        }

        const { githubLink } = req.body;

        // Auto-complete status if both githubLink and finalReport are present during creation
        let initialStatus = 'Proposed';
        if (githubLink && finalReportFile) {
            initialStatus = 'Completed';
        }

        const entry = await StudentResearch.create({
            title,
            abstract,
            keywords: parsedKeywords,
            department,
            academicYear,
            researchers: parsedResearchers,
            supervisor,
            publicationDOI: publicationDOI || '',
            ethicalNote: ethicalNote || '',
            files,
            proposalFile,
            finalReportFile,
            githubLink: githubLink || undefined,
            status: initialStatus,
            submittedBy: req.user._id,
        });

        // Notify lecturers and admins about new submission
        const reviewers = await User.find({ role: { $in: ['lecturer', 'admin'] }, isActive: true }).select('_id').lean();
        const notifications = reviewers.map((r) => ({
            recipientId: r._id,
            senderId: req.user._id,
            type: 'NEW_SUBMISSION',
            title: 'New Student Research Submission',
            message: `A new student research "${title}" has been submitted for review.`,
            relatedId: entry._id,
            relatedModel: 'StudentResearch',
            link: `/student-research/${entry._id}`,
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        await ActivityLog.create({
            userId: req.user._id,
            action: 'STUDENT_RESEARCH_CREATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('submittedBy', 'name email');
        res.status(201).json({
            success: true,
            message: 'Student research submitted successfully',
            data: { entry: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update student research
// @route   PUT /api/v1/student-research/:id
// @access  Student (own), Lecturer, Admin
const updateStudentResearch = async (req, res, next) => {
    try {
        const entry = await StudentResearch.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Student research not found' });
        }

        // Students can only update their own
        if (req.user.role === 'student' && entry.submittedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const {
            title, abstract, keywords, department, academicYear,
            researchers, supervisor, publicationDOI, ethicalNote, status, githubLink,
        } = req.body;

        if (title) entry.title = title;
        if (abstract) entry.abstract = abstract;
        if (keywords !== undefined) {
            entry.keywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        }
        if (department) entry.department = department;
        if (academicYear) entry.academicYear = academicYear;
        if (researchers !== undefined) {
            entry.researchers = typeof researchers === 'string' ? JSON.parse(researchers) : researchers;
        }
        if (supervisor !== undefined) entry.supervisor = supervisor;
        if (publicationDOI !== undefined) entry.publicationDOI = publicationDOI;
        if (ethicalNote !== undefined) entry.ethicalNote = ethicalNote;
        if (githubLink !== undefined) entry.githubLink = githubLink || '';

        // Only lecturers/admins can change status explicitly, OR auto-graduate
        if (status && (req.user.role === 'lecturer' || req.user.role === 'admin')) {
            entry.status = status;
        } else if (!status) {
            const hasFinalReport = (req.files && req.files['finalReport'] && req.files['finalReport'][0]) || (entry.finalReportFile && entry.finalReportFile.filePath);
            if (hasFinalReport) {
                entry.status = 'Completed';
            }
        }

        // Add new files
        if (req.files) {
            if (req.files['files'] && req.files['files'].length > 0) {
                const newFiles = req.files['files'].map((file) => ({
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    category: getFileCategory(file.mimetype),
                }));
                entry.files.push(...newFiles);
            }

            if (req.files['proposal'] && req.files['proposal'][0]) {
                const file = req.files['proposal'][0];
                if (entry.proposalFile && entry.proposalFile.filePath) {
                    try {
                        if (fs.existsSync(entry.proposalFile.filePath)) {
                            fs.unlinkSync(entry.proposalFile.filePath);
                        }
                    } catch {}
                }
                entry.proposalFile = {
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                };
            }

            if (req.files['finalReport'] && req.files['finalReport'][0]) {
                const file = req.files['finalReport'][0];
                if (entry.finalReportFile && entry.finalReportFile.filePath) {
                    try {
                        if (fs.existsSync(entry.finalReportFile.filePath)) {
                            fs.unlinkSync(entry.finalReportFile.filePath);
                        }
                    } catch {}
                }
                entry.finalReportFile = {
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                };
            }
        }

        await entry.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'STUDENT_RESEARCH_UPDATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('submittedBy', 'name email');
        res.json({
            success: true,
            message: 'Student research updated successfully',
            data: { entry: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete student research
// @route   DELETE /api/v1/student-research/:id
// @access  Admin only
const deleteStudentResearch = async (req, res, next) => {
    try {
        const entry = await StudentResearch.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Student research not found' });
        }

        // Delete files from disk
        for (const file of entry.files) {
            try {
                if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
            } catch (err) {
                console.warn(`Could not delete student research file: ${file.filePath}`, err.message);
            }
        }

        const entryTitle = entry.title;
        await entry.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'STUDENT_RESEARCH_DELETED',
            target: `Research: ${entryTitle} (${req.params.id})`,
        });

        res.json({ success: true, message: 'Student research deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a file from student research
// @route   DELETE /api/v1/student-research/:id/files/:fileId
// @access  Student (own), Lecturer, Admin
const deleteStudentResearchFile = async (req, res, next) => {
    try {
        const entry = await StudentResearch.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Student research not found' });
        }

        const fileIndex = entry.files.findIndex((f) => f._id.toString() === req.params.fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const file = entry.files[fileIndex];
        try {
            if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
        } catch (err) {
            console.warn(`Could not delete student research file from disk: ${file.filePath}`, err.message);
        }

        entry.files.splice(fileIndex, 1);
        await entry.save();

        res.json({ success: true, message: 'File deleted', data: { files: entry.files } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudentResearch,
    getStudentResearchById,
    createStudentResearch,
    updateStudentResearch,
    deleteStudentResearch,
    deleteStudentResearchFile,
};
