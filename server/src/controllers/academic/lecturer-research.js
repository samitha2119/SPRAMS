const fs = require('fs');
const LecturerResearch = require('../../models/LecturerResearch');
const ActivityLog = require('../../models/ActivityLog');
const { getFileCategory } = require('../../middleware/upload');

// @desc    Get all lecturer research entries (paginated)
// @route   GET /api/v1/lecturer-research
// @access  Private — lecturers see own, admin sees all
const getLecturerResearch = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
        if (req.query.year) filter.year = parseInt(req.query.year);
        if (req.query.status) filter.status = req.query.status;

        // Lecturers see only their own research
        if (req.user.role === 'lecturer') {
            filter.uploadedBy = req.user._id;
        }

        // Students cannot access lecturer research list (handled at route level)

        const [entries, total] = await Promise.all([
            LecturerResearch.find(filter)
                .populate('uploadedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LecturerResearch.countDocuments(filter),
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

// @desc    Get single lecturer research
// @route   GET /api/v1/lecturer-research/:id
// @access  Lecturer (own), Admin
const getLecturerResearchById = async (req, res, next) => {
    try {
        const entry = await LecturerResearch.findById(req.params.id)
            .populate('uploadedBy', 'name email');

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Lecturer research not found' });
        }

        // Lecturers can only see their own
        if (req.user.role === 'lecturer' && entry.uploadedBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: { entry } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create lecturer research
// @route   POST /api/v1/lecturer-research
// @access  Lecturer, Admin
const createLecturerResearch = async (req, res, next) => {
    try {
        const {
            title, abstract, keywords, coAuthors, department, year,
            publicationTitle, journalName, volume, issueNumber, pages, doi, publicationUrl,
        } = req.body;

        let parsedKeywords = [];
        if (keywords) {
            parsedKeywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        }

        let parsedCoAuthors = [];
        if (coAuthors) {
            parsedCoAuthors = typeof coAuthors === 'string' ? JSON.parse(coAuthors) : coAuthors;
        }

        const files = (req.files || []).map((file) => ({
            originalName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            category: getFileCategory(file.mimetype),
        }));

        const entry = await LecturerResearch.create({
            title,
            abstract,
            keywords: parsedKeywords,
            coAuthors: parsedCoAuthors,
            department,
            year: parseInt(year),
            publicationTitle: publicationTitle || '',
            journalName: journalName || '',
            volume: volume || '',
            issueNumber: issueNumber || '',
            pages: pages || '',
            doi: doi || '',
            publicationUrl: publicationUrl || '',
            files,
            uploadedBy: req.user._id,
        });

        await ActivityLog.create({
            userId: req.user._id,
            action: 'LECTURER_RESEARCH_CREATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('uploadedBy', 'name email');
        res.status(201).json({
            success: true,
            message: 'Lecturer research created successfully',
            data: { entry: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update lecturer research
// @route   PUT /api/v1/lecturer-research/:id
// @access  Lecturer (own), Admin
const updateLecturerResearch = async (req, res, next) => {
    try {
        const entry = await LecturerResearch.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Lecturer research not found' });
        }

        // Lecturers can only update their own
        if (req.user.role === 'lecturer' && entry.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const {
            title, abstract, keywords, coAuthors, department, year,
            publicationTitle, journalName, volume, issueNumber, pages, doi, publicationUrl, status,
        } = req.body;

        if (title) entry.title = title;
        if (abstract) entry.abstract = abstract;
        if (keywords !== undefined) {
            entry.keywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        }
        if (coAuthors !== undefined) {
            entry.coAuthors = typeof coAuthors === 'string' ? JSON.parse(coAuthors) : coAuthors;
        }
        if (department) entry.department = department;
        if (year) entry.year = parseInt(year);
        if (publicationTitle !== undefined) entry.publicationTitle = publicationTitle;
        if (journalName !== undefined) entry.journalName = journalName;
        if (volume !== undefined) entry.volume = volume;
        if (issueNumber !== undefined) entry.issueNumber = issueNumber;
        if (pages !== undefined) entry.pages = pages;
        if (doi !== undefined) entry.doi = doi;
        if (publicationUrl !== undefined) entry.publicationUrl = publicationUrl;
        if (status) entry.status = status;

        // Add new files
        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map((file) => ({
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                category: getFileCategory(file.mimetype),
            }));
            entry.files.push(...newFiles);
        }

        await entry.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'LECTURER_RESEARCH_UPDATED',
            target: `Research: ${entry.title} (${entry._id})`,
        });

        const populated = await entry.populate('uploadedBy', 'name email');
        res.json({
            success: true,
            message: 'Lecturer research updated successfully',
            data: { entry: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete lecturer research
// @route   DELETE /api/v1/lecturer-research/:id
// @access  Lecturer (own), Admin
const deleteLecturerResearch = async (req, res, next) => {
    try {
        const entry = await LecturerResearch.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Lecturer research not found' });
        }

        // Lecturers can only delete their own
        if (req.user.role === 'lecturer' && entry.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Delete files
        for (const file of entry.files) {
            try {
                if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
            } catch (err) {
                console.warn(`Could not delete lecturer research file: ${file.filePath}`, err.message);
            }
        }

        const entryTitle = entry.title;
        await entry.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'LECTURER_RESEARCH_DELETED',
            target: `Research: ${entryTitle} (${req.params.id})`,
        });

        res.json({ success: true, message: 'Lecturer research deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLecturerResearch,
    getLecturerResearchById,
    createLecturerResearch,
    updateLecturerResearch,
    deleteLecturerResearch,
};
