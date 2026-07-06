const express = require('express');
const router = express.Router();
const {
    serveFile,
    serveProjectProposal,
    serveResearchProposal,
    serveResearchFinalReport,
    serveProjectFinalReport,
    serveStudentResearchProposal,
    serveStudentResearchFinalReport
} = require('../../controllers/system/files');
const { protect } = require('../../middleware/auth');

// Authenticated file serving
router.get('/projects/:projectId/proposal', protect, serveProjectProposal);
router.get('/projects/:projectId/final-report', protect, serveProjectFinalReport);
router.get('/research/:researchId/proposal', protect, serveResearchProposal);
router.get('/research/:researchId/final-report', protect, serveResearchFinalReport);
router.get('/student-research/:researchId/proposal', protect, serveStudentResearchProposal);
router.get('/student-research/:researchId/final-report', protect, serveStudentResearchFinalReport);
router.get('/:entryId/:fileId', protect, serveFile);

module.exports = router;
