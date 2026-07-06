const express = require('express');
const router = express.Router();
const {
    getProjects, getProject, createProject, updateProject, deleteProject,
    addMember, removeMember, exportCSV, deleteProjectFile
} = require('../../controllers/academic/projects');
const { projectValidation, projectUpdateValidation } = require('../../middleware/validators/projectValidator');
const { protect, authorize } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');

// All routes require authentication
router.use(protect);

// CSV export (before :id routes to avoid conflict)
router.get('/export/csv', authorize('admin'), exportCSV);

// Project CRUD
router.route('/')
    .get(getProjects)
    .post(authorize('admin', 'lecturer', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), projectValidation, createProject);

router.route('/:id')
    .get(getProject)
    .put(authorize('admin', 'lecturer', 'student'), upload.fields([{ name: 'proposal', maxCount: 1 }, { name: 'finalReport', maxCount: 1 }, { name: 'files', maxCount: 10 }]), projectUpdateValidation, updateProject)
    .delete(authorize('admin'), deleteProject);

// Member management
router.post('/:id/members', authorize('admin', 'lecturer'), addMember);
router.delete('/:id/members/:regNo', authorize('admin', 'lecturer'), removeMember);

// File management
router.delete('/:id/files/:fileId', authorize('admin', 'lecturer', 'student'), deleteProjectFile);

module.exports = router;
