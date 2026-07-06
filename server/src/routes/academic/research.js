const express = require('express');
const router = express.Router();
const {
    getResearchEntries, getResearchEntry, createResearchEntry, updateResearchEntry,
    deleteResearchEntry, deleteFile,
} = require('../../controllers/academic/research');
const { protect, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');

router.use(protect);

router.route('/')
    .get(getResearchEntries)
    .post(authorize('admin', 'lecturer', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), createResearchEntry);

router.route('/:id')
    .get(getResearchEntry)
    .put(authorize('admin', 'lecturer', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), updateResearchEntry)
    .delete(authorize('admin'), deleteResearchEntry);

router.delete('/:id/files/:fileId', authorize('admin', 'lecturer'), deleteFile);

module.exports = router;
