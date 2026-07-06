const Project = require('../../models/Project');
const ResearchEntry = require('../../models/ResearchEntry');
const claudeService = require('../../services/claudeService');

// @desc    Unified search across projects and research
// @route   GET /api/search
// @access  Private (all roles)
const search = async (req, res, next) => {
    try {
        const { q, type = 'all', department, year, fileType, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const results = { projects: [], research: [], suggestions: [] };

        // Fetch AI keyword suggestions (only if query provided)
        let aiSuggestions = [];
        if (q && q.trim().length > 2) {
            try {
                aiSuggestions = await claudeService.expandSearchQuery(q);
            } catch (err) {
                console.warn('Search query expansion failed:', err.message);
            }
        }

        // Search projects
        if (type === 'all' || type === 'projects') {
            let projectFilter = { status: 'Completed' };

            if (q) {
                const searchRegex = { $regex: q, $options: 'i' };
                projectFilter.$or = [
                    { title: searchRegex },
                    { abstract: searchRegex },
                    { department: searchRegex },
                    { groupName: searchRegex },
                    { 'members.name': searchRegex }
                ];
            }

            if (department) projectFilter.department = { $regex: department, $options: 'i' };
            if (year) projectFilter.academicYear = { $regex: year };

            const sortOptions = { createdAt: -1 };
            const selectOptions = {};

            results.projectsTotal = await Project.countDocuments(projectFilter);
            results.projects = await Project.find(projectFilter, selectOptions)
                .populate('createdBy', 'name email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean();
        }

        // Search research entries
        if (type === 'all' || type === 'research') {
            const StudentResearch = require('../../models/StudentResearch');
            let researchFilter = { status: 'Completed' };
            let studentResearchFilter = { status: 'Completed' };

            if (q) {
                const searchRegex = { $regex: q, $options: 'i' };
                researchFilter.$or = [
                    { title: searchRegex },
                    { description: searchRegex },
                    { aiSummary: searchRegex },
                    { tags: searchRegex }
                ];
                studentResearchFilter.$or = [
                    { title: searchRegex },
                    { abstract: searchRegex },
                    { keywords: searchRegex },
                    { researchers: searchRegex }
                ];
            }

            if (department) {
                researchFilter.department = { $regex: department, $options: 'i' };
                studentResearchFilter.department = { $regex: department, $options: 'i' };
            }

            if (year) {
                researchFilter.year = parseInt(year);
                studentResearchFilter.academicYear = { $regex: year };
            }

            if (fileType) {
                researchFilter['files.fileType'] = fileType;
            }

            const sortOptions = { createdAt: -1 };
            const selectOptions = {};

            const [researchEntries, studentResearches] = await Promise.all([
                ResearchEntry.find(researchFilter, selectOptions)
                    .populate('authorId', 'name email')
                    .sort(sortOptions)
                    .lean(),
                StudentResearch.find(studentResearchFilter, selectOptions)
                    .populate('submittedBy', 'name email')
                    .sort(sortOptions)
                    .lean()
            ]);

            // Map StudentResearch to ResearchEntry format for UI compatibility
            const mappedStudentResearch = studentResearches.map(sr => ({
                ...sr,
                description: sr.abstract,
                tags: sr.keywords,
                year: parseInt(sr.academicYear.split('/')[0]) || 2024,
                isStudentResearch: true
            }));

            const combinedResearch = [...researchEntries, ...mappedStudentResearch];
            results.researchTotal = combinedResearch.length;
            results.research = combinedResearch.slice(skip, skip + parseInt(limit));
        }

        results.suggestions = aiSuggestions;

        res.json({
            success: true,
            data: {
                query: q,
                results,
                pagination: { page: parseInt(page), limit: parseInt(limit) },
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { search };
