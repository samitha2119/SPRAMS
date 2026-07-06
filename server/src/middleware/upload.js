const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIMETYPES = {
    'application/pdf': { ext: 'pdf', category: 'pdf' },
    'image/jpeg': { ext: 'jpg', category: 'image' },
    'image/png': { ext: 'png', category: 'image' },
    'audio/mpeg': { ext: 'mp3', category: 'audio' },
    'audio/wav': { ext: 'wav', category: 'audio' },
    'video/mp4': { ext: 'mp4', category: 'video' },
};

const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // IMPORTANT: In multipart forms, text fields MUST be sent before files 
        // for req.body to be populated here.
        const year = req.body.year || new Date().getFullYear();
        const mimeInfo = ALLOWED_MIMETYPES[file.mimetype];
        if (!mimeInfo) {
            return cb(new Error('Invalid file type'), false);
        }
        const category = mimeInfo.category;
        const uploadDir = path.join(__dirname, '../../uploads', String(year), category);

        // Create directory if not exists
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMETYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `File type '${file.mimetype}' is not allowed. Only PDF, JPG, PNG, MP3, WAV, MP4 are permitted.`
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10,
    },
});

const getFileCategory = (mimetype) => {
    return ALLOWED_MIMETYPES[mimetype]?.category || 'other';
};

module.exports = { upload, ALLOWED_MIMETYPES, getFileCategory };
