const path = require('path');
const fs = require('fs');
const ResearchEntry = require('../../models/ResearchEntry');
const Project = require('../../models/Project');
const StudentResearch = require('../../models/StudentResearch');

/**
 * Helper: normalize a file path to use forward slashes (cross-platform safe)
 */
const normalizePath = (p) => path.resolve(p).replace(/\\/g, '/');

/**
 * Helper: stream a file to the response
 */
const streamFile = (res, next, filePath, fileType, originalName, disposition = 'inline') => {
    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const uploadsDir = normalizePath(path.join(__dirname, '../../../uploads'));
    const normalizedResolved = normalizePath(resolvedPath);

    if (!normalizedResolved.startsWith(uploadsDir)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.setHeader('Content-Type', fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(originalName)}"`);
    if (disposition === 'inline') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    } else {
        res.setHeader('Cache-Control', 'private, max-age=3600');
    }

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.on('error', (err) => next(err));
    fileStream.pipe(res);
};

// @desc    Serve a protected file (research or project)
// @route   GET /api/files/:entryId/:fileId
// @access  Private (authenticated users only)
const serveFile = async (req, res, next) => {
    try {
        const { entryId, fileId } = req.params;

        // Try ResearchEntry first
        let entry = await ResearchEntry.findById(entryId).catch(() => null);
        if (entry) {
            const file = entry.files.find((f) => f._id.toString() === fileId);
            if (file) {
                return streamFile(res, next, file.filePath, file.fileType, file.originalName, 'inline');
            }
        }

        // Try StudentResearch second
        let studentResearch = await StudentResearch.findById(entryId).catch(() => null);
        if (studentResearch) {
            const file = studentResearch.files.find((f) => f._id.toString() === fileId);
            if (file) {
                return streamFile(res, next, file.filePath, file.fileType, file.originalName, 'inline');
            }
        }

        // Try Project third
        let project = await Project.findById(entryId).catch(() => null);
        if (project) {
            const file = project.files.find((f) => f._id.toString() === fileId);
            if (file) {
                return streamFile(res, next, file.filePath, file.fileType, file.originalName, 'inline');
            }
        }

        return res.status(404).json({ success: false, message: 'File or entry not found' });
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected project proposal PDF
// @route   GET /api/v1/files/projects/:projectId/proposal
// @access  Private (authenticated users only)
const serveProjectProposal = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const file = project.proposalFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No proposal PDF has been uploaded for this project' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Proposal.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected research proposal PDF
// @route   GET /api/v1/files/research/:researchId/proposal
// @access  Private (authenticated users only)
const serveResearchProposal = async (req, res, next) => {
    try {
        const { researchId } = req.params;

        const entry = await ResearchEntry.findById(researchId);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }

        const file = entry.proposalFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No proposal PDF has been uploaded for this research' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Proposal.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected project final report PDF
// @route   GET /api/v1/files/projects/:projectId/final-report
// @access  Private (authenticated users only)
const serveProjectFinalReport = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const file = project.finalReportFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No final report PDF has been uploaded for this project' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Final_Report.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected student research proposal PDF
// @route   GET /api/v1/files/student-research/:researchId/proposal
// @access  Private (authenticated users only)
const serveStudentResearchProposal = async (req, res, next) => {
    try {
        const { researchId } = req.params;

        const entry = await StudentResearch.findById(researchId);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research not found' });
        }

        const file = entry.proposalFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No proposal PDF has been uploaded for this research' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Proposal.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected student research final report PDF
// @route   GET /api/v1/files/student-research/:researchId/final-report
// @access  Private (authenticated users only)
const serveStudentResearchFinalReport = async (req, res, next) => {
    try {
        const { researchId } = req.params;

        const entry = await StudentResearch.findById(researchId);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research not found' });
        }

        const file = entry.finalReportFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No final report PDF has been uploaded for this research' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Final_Report.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

// @desc    Serve a protected research final report PDF
// @route   GET /api/v1/files/research/:researchId/final-report
// @access  Private (authenticated users only)
const serveResearchFinalReport = async (req, res, next) => {
    try {
        const { researchId } = req.params;

        const entry = await ResearchEntry.findById(researchId);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Research entry not found' });
        }

        const file = entry.finalReportFile;
        if (!file || !file.filePath) {
            return res.status(404).json({ success: false, message: 'No final report PDF has been uploaded for this research' });
        }

        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        return streamFile(res, next, file.filePath, file.fileType || 'application/pdf', file.originalName || 'Final_Report.pdf', disposition);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    serveFile,
    serveProjectProposal,
    serveResearchProposal,
    serveResearchFinalReport,
    serveProjectFinalReport,
    serveStudentResearchProposal,
    serveStudentResearchFinalReport
};
