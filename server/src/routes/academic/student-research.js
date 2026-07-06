const express = require('express');
const router = express.Router();
const {
    getStudentResearch,
    getStudentResearchById,
    createStudentResearch,
    updateStudentResearch,
    deleteStudentResearch,
    deleteStudentResearchFile,
} = require('../../controllers/academic/student-research');
const { protect, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');

router.use(protect);

router.route('/')
    .get(getStudentResearch)
    .post(authorize('admin', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), createStudentResearch);

router.route('/:id')
    .get(getStudentResearchById)
    .put(authorize('admin', 'lecturer', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), updateStudentResearch)
    .delete(authorize('admin'), deleteStudentResearch);

router.delete('/:id/files/:fileId', authorize('admin', 'lecturer', 'student'), deleteStudentResearchFile);

module.exports = router;
