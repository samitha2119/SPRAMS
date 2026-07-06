const express = require('express');
const router = express.Router();
const {
    getLecturerResearch,
    getLecturerResearchById,
    createLecturerResearch,
    updateLecturerResearch,
    deleteLecturerResearch,
} = require('../../controllers/academic/lecturer-research');
const { protect, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');

router.use(protect);

router.route('/')
    .get(authorize('admin', 'lecturer'), getLecturerResearch)
    .post(authorize('admin', 'lecturer'), upload.array('files', 10), createLecturerResearch);

router.route('/:id')
    .get(authorize('admin', 'lecturer'), getLecturerResearchById)
    .put(authorize('admin', 'lecturer'), upload.array('files', 10), updateLecturerResearch)
    .delete(authorize('admin', 'lecturer'), deleteLecturerResearch);

module.exports = router;
