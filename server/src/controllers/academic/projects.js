const Project = require('../../models/Project');
const ActivityLog = require('../../models/ActivityLog');
const { Parser } = require('fast-csv');
const logger = require('../../utils/logger');
const fs = require('fs');
const { getFileCategory } = require('../../middleware/upload');


// @desc    Get all projects (paginated, filterable)
// @route   GET /api/projects
// @access  Private (all roles)
const getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        logger.info(`Fetching projects: page=${page}, limit=${limit}, dept=${req.query.department || 'all'}`);

        const filter = {};
        if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
        if (req.query.academicYear) filter.academicYear = req.query.academicYear;
        if (req.query.createdBy) {
            if (req.query.studentName) {
                filter.$or = [
                    { createdBy: req.query.createdBy },
                    { 'members.name': { $regex: req.query.studentName, $options: 'i' } }
                ];
            } else {
                filter.createdBy = req.query.createdBy;
            }
        }

        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Project.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                projects,
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

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (all roles)
const getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.json({ success: true, data: { project } });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Admin only
const createProject = async (req, res, next) => {
    try {
        const { title, department, academicYear, groupName, supervisor, abstract, members, githubLink } = req.body;

        logger.info(`Creating new project: "${title}" by user ${req.user.email}`);

        let membersList = [];
        if (members) {
            try {
                membersList = typeof members === 'string' ? JSON.parse(members) : members;
            } catch (e) {
                logger.error('Failed to parse members JSON', e);
                membersList = [];
            }
        }

        if (!req.files || !req.files['proposal'] || !req.files['proposal'][0]) {
            return res.status(400).json({ success: false, message: 'Project proposal PDF file is required' });
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

        let files = [];
        if (req.files && req.files['files'] && req.files['files'].length > 0) {
            files = req.files['files'].map((file) => ({
                originalName: file.originalname,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                category: getFileCategory(file.mimetype),
            }));
        }

        // Auto-complete status if both githubLink and finalReport are present during creation
        let initialStatus = 'Proposed';
        if (githubLink && finalReportFile) {
            initialStatus = 'Completed';
        }

        const project = await Project.create({
            title,
            department,
            academicYear,
            groupName,
            supervisor,
            abstract,
            members: membersList,
            createdBy: req.user._id,
            githubLink: githubLink || undefined,
            status: initialStatus,
            proposalFile,
            finalReportFile,
            files,
        });

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_CREATED',
            target: `Project: ${project.title} (${project._id})`,
        });

        const populated = await project.populate('createdBy', 'name email');

        res.status(201).json({ success: true, message: 'Project created successfully', data: { project: populated } });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Admin only
const updateProject = async (req, res, next) => {
    try {
        const { title, department, academicYear, groupName, supervisor, abstract, members, githubLink, status } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Students can only update their own projects
        if (req.user.role === 'student' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
        }

        if (title) project.title = title;
        if (department) project.department = department;
        if (academicYear) project.academicYear = academicYear;
        if (groupName) project.groupName = groupName;
        if (supervisor) project.supervisor = supervisor;
        if (abstract) project.abstract = abstract;
        if (githubLink !== undefined) project.githubLink = githubLink || '';

        if (members !== undefined) {
            let membersList = [];
            if (members) {
                try {
                    membersList = typeof members === 'string' ? JSON.parse(members) : members;
                } catch (e) {
                    logger.error('Failed to parse members JSON', e);
                    membersList = [];
                }
            }
            project.members = membersList;
        }

        if (req.files) {
            if (req.files['proposal'] && req.files['proposal'][0]) {
                const file = req.files['proposal'][0];
                if (project.proposalFile && project.proposalFile.filePath) {
                    try {
                        if (fs.existsSync(project.proposalFile.filePath)) {
                            fs.unlinkSync(project.proposalFile.filePath);
                        }
                    } catch (err) {
                        logger.error(`Failed to delete old proposal file: ${project.proposalFile.filePath}`, err);
                    }
                }
                project.proposalFile = {
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                };
            }

            if (req.files['finalReport'] && req.files['finalReport'][0]) {
                const file = req.files['finalReport'][0];
                if (project.finalReportFile && project.finalReportFile.filePath) {
                    try {
                        if (fs.existsSync(project.finalReportFile.filePath)) {
                            fs.unlinkSync(project.finalReportFile.filePath);
                        }
                    } catch (err) {
                        logger.error(`Failed to delete old final report file: ${project.finalReportFile.filePath}`, err);
                    }
                }
                project.finalReportFile = {
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                };
            }
            if (req.files['files'] && req.files['files'].length > 0) {
                const newFiles = req.files['files'].map((file) => ({
                    originalName: file.originalname,
                    filePath: file.path,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    category: getFileCategory(file.mimetype),
                }));
                project.files.push(...newFiles);
            }
        }

        // Handle lifecycle status updates
        if (status) {
            project.status = status;
        } else {
            // Auto transition state
            const hasFinalReport = (req.files && req.files['finalReport'] && req.files['finalReport'][0]) || (project.finalReportFile && project.finalReportFile.filePath);
            if (hasFinalReport) {
                project.status = 'Completed';
            }
        }

        await project.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_UPDATED',
            target: `Project: ${project.title} (${project._id})`,
        });

        const populated = await project.populate('createdBy', 'name email');
        res.json({ success: true, message: 'Project updated successfully', data: { project: populated } });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Admin only
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const projectTitle = project.title;

        // Delete physical proposal file from disk
        if (project.proposalFile && project.proposalFile.filePath) {
            try {
                if (fs.existsSync(project.proposalFile.filePath)) {
                    fs.unlinkSync(project.proposalFile.filePath);
                }
            } catch (err) {
                logger.error(`Failed to delete proposal file: ${project.proposalFile.filePath}`, err);
            }
        }

        await project.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_DELETED',
            target: `Project: ${projectTitle} (${req.params.id})`,
        });

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Admin only
const addMember = async (req, res, next) => {
    try {
        const { name, regNo } = req.body;
        if (!name || !regNo) {
            return res.status(400).json({ success: false, message: 'Member name and regNo are required' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check for duplicate regNo
        const exists = project.members.some((m) => m.regNo === regNo);
        if (exists) {
            return res.status(409).json({ success: false, message: 'Member with this regNo already exists' });
        }

        project.members.push({ name: name.trim(), regNo: regNo.trim() });
        await project.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_MEMBER_ADDED',
            target: `Project: ${project.title}, Member: ${name} (${regNo})`,
        });

        res.json({ success: true, message: 'Member added', data: { members: project.members } });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:regNo
// @access  Admin only
const removeMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const initialLength = project.members.length;
        project.members = project.members.filter((m) => m.regNo !== req.params.regNo);

        if (project.members.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        await project.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_MEMBER_REMOVED',
            target: `Project: ${project.title}, Member RegNo: ${req.params.regNo}`,
        });

        res.json({ success: true, message: 'Member removed', data: { members: project.members } });
    } catch (error) {
        next(error);
    }
};

// @desc    Export projects as CSV
// @route   GET /api/projects/export/csv
// @access  Admin only
const exportCSV = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
        if (req.query.academicYear) filter.academicYear = req.query.academicYear;

        const projects = await Project.find(filter).populate('createdBy', 'name email').lean();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="projects_export.csv"');

        const rows = [];
        rows.push(['Title', 'Department', 'Academic Year', 'Group Name', 'Supervisor', 'Members Count', 'Member Names', 'Abstract', 'Created By', 'Created At']);

        for (const p of projects) {
            const memberNames = p.members.map((m) => `${m.name} (${m.regNo})`).join('; ');
            rows.push([
                p.title,
                p.department,
                p.academicYear,
                p.groupName,
                p.supervisor,
                p.members.length,
                memberNames,
                p.abstract.replace(/\n/g, ' '),
                p.createdBy?.name || 'N/A',
                new Date(p.createdAt).toISOString(),
            ]);
        }

        // Write CSV manually
        const csvContent = rows
            .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        await ActivityLog.create({
            userId: req.user._id,
            action: 'EXPORT_CSV',
            target: `Projects CSV export (${projects.length} records)`,
        });

        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete supplementary file from project
// @route   DELETE /api/projects/:id/files/:fileId
// @access  Private (Admin, Lecturer, Student creator)
const deleteProjectFile = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Students can only update their own
        if (req.user.role === 'student' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const file = project.files.find((f) => f._id.toString() === req.params.fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found in project' });
        }

        // Delete physical file
        if (file.filePath && fs.existsSync(file.filePath)) {
            try {
                fs.unlinkSync(file.filePath);
            } catch (err) {
                logger.error(`Failed to delete physical file: ${file.filePath}`, err);
            }
        }

        // Remove from db
        project.files = project.files.filter((f) => f._id.toString() !== req.params.fileId);
        await project.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'PROJECT_FILE_DELETED',
            target: `File: ${file.originalName} from Project: ${project.title}`,
        });

        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    exportCSV,
    deleteProjectFile,
};
