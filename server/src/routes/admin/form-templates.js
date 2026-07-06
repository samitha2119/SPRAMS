const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getFormTemplates,
    createFormTemplate,
    downloadFormTemplate,
    updateFormTemplate,
    deleteFormTemplate,
} = require('../../controllers/admin/form-templates');
const { protect, authorize } = require('../../middleware/auth');

// Separate multer config for form templates (PDF/DOCX only)
const templateStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/templates');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `template-${uniqueSuffix}${ext}`);
    },
});

const templateFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and DOCX files are allowed for templates'), false);
    }
};

const templateUpload = multer({
    storage: templateStorage,
    fileFilter: templateFilter,
    limits: { fileSize: 50 * 1024 * 1024, files: 1 }, // 50MB
});

router.use(protect);

router.route('/')
    .get(getFormTemplates)
    .post(authorize('admin'), templateUpload.single('file'), createFormTemplate);

router.get('/:id/download', downloadFormTemplate);

router.route('/:id')
    .put(authorize('admin'), templateUpload.single('file'), updateFormTemplate)
    .delete(authorize('admin'), deleteFormTemplate);

module.exports = router;
