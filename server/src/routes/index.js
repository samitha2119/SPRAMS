const express = require('express');
const router = express.Router();

const auth = require('./auth');
const projects = require('./academic/projects');
const research = require('./academic/research');
const studentResearch = require('./academic/student-research');
const lecturerResearch = require('./academic/lecturer-research');
const evaluations = require('./admin/evaluations');
const formTemplates = require('./admin/form-templates');
const dashboard = require('./system/dashboard');
const files = require('./system/files');
const notifications = require('./system/notifications');
const search = require('./system/search');
const workspace = require('./system/workspace');

router.use('/auth', auth);
router.use('/projects', projects);
router.use('/research', research);
router.use('/student-research', studentResearch);
router.use('/lecturer-research', lecturerResearch);
router.use('/evaluations', evaluations);
router.use('/form-templates', formTemplates);
router.use('/dashboard', dashboard);
router.use('/files', files);
router.use('/notifications', notifications);
router.use('/search', search);
router.use('/workspace', workspace);

module.exports = router;
