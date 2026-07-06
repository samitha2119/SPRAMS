const path = require('path');
const fs = require('fs');
const ResearchEntry = require('../../models/ResearchEntry');
const ActivityLog = require('../../models/ActivityLog');
const { getFileCategory } = require('../../middleware/upload');
const claudeService = require('../../services/claudeService');

// @desc    Get all research entries (paginated)
// @route   GET /api/research
// @access  Private (all roles)
const getResearchEntries = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.year) filter.year = parseInt(req.query.year);
        if (req.query.fileType) {
            filter['files.fileType'] = req.query.fileType;
        }
        if (req.query.tag) {
            filter.tags = { $in: [req.query.tag] };
        }

        const [entries, total] = await Promise.all([
            ResearchEntry.find(filter)
                .populate('authorId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ResearchEntry.countDocuments(filter),
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

// @desc    Get single research entry
// @route   GET /api/research/:id
// @access  Private (all roles)
const getResearchEntry = async (req, res, next) => {
    try {
        const entry = await ResearchEntry.findById(req.params.id).populate('authorId', 'name email');
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }
        res.json({ success: true, data: { entry } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create research entry
// @route   POST /api/research
// @access  Admin only
const createResearchEntry = async (req, res, next) => {
    try {
        const { title, description, year, tags } = req.body;

        // Parse tags if sent as string
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Build file documents from uploaded files
        const filesList = req.files && req.files['files'] ? req.files['files'] : [];
        const files = filesList.map((file) => ({
            originalName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            category: getFileCategory(file.mimetype),
        }));

        let proposalFile = undefined;
        if (req.files && req.files['proposal'] && req.files['proposal'][0]) {
            const propFile = req.files['proposal'][0];
            proposalFile = {
                originalName: propFile.originalname,
                filePath: propFile.path,
                fileType: propFile.mimetype,
                fileSize: propFile.size,
            };
        }

        const entry = await ResearchEntry.create({
            title,
            description,
            authorId: req.user._id,
            year: parseInt(year),
            tags: parsedTags,
            files,
            proposalFile,
        });

        // Auto-generate AI summary (async, don't block response)
        try {
            const aiSummary = await claudeService.generateResearchSummary(title, description);
            if (aiSummary) {
                await ResearchEntry.findByIdAndUpdate(entry._id, {
                    aiSummary,
                    aiSummaryGeneratedAt: new Date(),
                });
                entry.aiSummary = aiSummary;

                await ActivityLog.create({
                    userId: req.user._id,
                    action: 'AI_SUMMARY_GENERATED',
                    target: `Research: ${entry.title} (${entry._id})`,
                });
            }
        } catch (aiError) {
            console.warn('AI summary generation failed:', aiError.message);
        }

        await ActivityLog.create({
            userId: req.user._id,
            action: 'RESEARCH_CREATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('authorId', 'name email');
        res.status(201).json({ success: true, message: 'Research entry created', data: { entry: populated } });
    } catch (error) {
        next(error);
    }
};

// @desc    Update research entry
// @route   PUT /api/research/:id
// @access  Admin only
const updateResearchEntry = async (req, res, next) => {
    try {
        const entry = await ResearchEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }

        // Students & Lecturers can only update their own research entries
        if (req.user.role !== 'admin' && entry.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this research entry' });
        }

        const { title, description, year, tags, githubLink, status } = req.body;

        if (title) entry.title = title;
        if (description) entry.description = description;
        if (year) entry.year = parseInt(year);
        if (githubLink !== undefined) entry.githubLink = githubLink || '';
        if (tags !== undefined) {
            entry.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Add new uploaded files
        if (req.files && req.files['files'] && req.files['files'].length > 0) {
            const newFiles = req.files['files'].map((file) => ({
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                category: getFileCategory(file.mimetype),
            }));
            entry.files.push(...newFiles);
        }

        // Add/update proposal PDF
        if (req.files && req.files['proposal'] && req.files['proposal'][0]) {
            const propFile = req.files['proposal'][0];
            // Delete old proposal file if it exists
            if (entry.proposalFile && entry.proposalFile.filePath) {
                try {
                    if (fs.existsSync(entry.proposalFile.filePath)) {
                        fs.unlinkSync(entry.proposalFile.filePath);
                    }
                } catch (err) {
                    console.warn(`Could not delete old proposal file: ${entry.proposalFile.filePath}`, err.message);
                }
            }
            entry.proposalFile = {
                originalName: propFile.originalname,
                filePath: propFile.path,
                fileType: propFile.mimetype,
                fileSize: propFile.size,
            };
        }

        // Add/update final report PDF
        if (req.files && req.files['finalReport'] && req.files['finalReport'][0]) {
            const finalFile = req.files['finalReport'][0];
            // Delete old final report file if it exists
            if (entry.finalReportFile && entry.finalReportFile.filePath) {
                try {
                    if (fs.existsSync(entry.finalReportFile.filePath)) {
                        fs.unlinkSync(entry.finalReportFile.filePath);
                    }
                } catch (err) {
                    console.warn(`Could not delete old final report file: ${entry.finalReportFile.filePath}`, err.message);
                }
            }
            entry.finalReportFile = {
                originalName: finalFile.originalname,
                filePath: finalFile.path,
                fileType: finalFile.mimetype,
                fileSize: finalFile.size,
            };
        }

        // Handle lifecycle status updates
        if (status) {
            entry.status = status;
        } else {
            // Auto transition state to Completed if final report is uploaded or already exists
            const hasFinalReport = (req.files && req.files['finalReport'] && req.files['finalReport'][0]) || (entry.finalReportFile && entry.finalReportFile.filePath);
            if (hasFinalReport) {
                entry.status = 'Completed';
            }
        }

        // Regenerate AI summary if content changed
        if (title || description) {
            try {
                const aiSummary = await claudeService.generateResearchSummary(
                    entry.title,
                    entry.description
                );
                if (aiSummary) {
                    entry.aiSummary = aiSummary;
                    entry.aiSummaryGeneratedAt = new Date();
                }
            } catch (aiError) {
                console.warn('AI summary regeneration failed:', aiError.message);
            }
        }

        await entry.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'RESEARCH_UPDATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('authorId', 'name email');
        res.json({ success: true, message: 'Research entry updated', data: { entry: populated } });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete research entry
// @route   DELETE /api/research/:id
// @access  Admin only
const deleteResearchEntry = async (req, res, next) => {
    try {
        const entry = await ResearchEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }

        // Delete associated files from disk
        for (const file of entry.files) {
            try {
                if (fs.existsSync(file.filePath)) {
                    fs.unlinkSync(file.filePath);
                }
            } catch (err) {
                console.warn(`Could not delete file: ${file.filePath}`, err.message);
            }
        }

        // Delete associated proposal file from disk
        if (entry.proposalFile && entry.proposalFile.filePath) {
            try {
                if (fs.existsSync(entry.proposalFile.filePath)) {
                    fs.unlinkSync(entry.proposalFile.filePath);
                }
            } catch (err) {
                console.warn(`Could not delete proposal file: ${entry.proposalFile.filePath}`, err.message);
            }
        }

        const entryTitle = entry.title;
        await entry.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'RESEARCH_DELETED',
            target: `Research: ${entryTitle} (${req.params.id})`,
        });

        res.json({ success: true, message: 'Research entry deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a specific file from a research entry
// @route   DELETE /api/research/:id/files/:fileId
// @access  Admin only
const deleteFile = async (req, res, next) => {
    try {
        const entry = await ResearchEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }

        const fileIndex = entry.files.findIndex((f) => f._id.toString() === req.params.fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const file = entry.files[fileIndex];

        // Delete from disk
        try {
            if (fs.existsSync(file.filePath)) {
                fs.unlinkSync(file.filePath);
            }
        } catch (err) {
            console.warn(`Could not delete file from disk: ${file.filePath}`);
        }

        entry.files.splice(fileIndex, 1);
        await entry.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'FILE_DELETED',
            target: `File: ${file.originalName} from Research: ${entry.title}`,
        });

        res.json({ success: true, message: 'File deleted', data: { files: entry.files } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getResearchEntries,
    getResearchEntry,
    createResearchEntry,
    updateResearchEntry,
    deleteResearchEntry,
    deleteFile,
};
