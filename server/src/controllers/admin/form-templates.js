const fs = require('fs');
const path = require('path');
const FormTemplate = require('../../models/FormTemplate');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const User = require('../../models/User');

// @desc    Get all form templates
// @route   GET /api/v1/form-templates
// @access  Private (all roles — students only see active templates)
const getFormTemplates = async (req, res, next) => {
    try {
        const filter = {};

        // Students only see active templates
        if (req.user.role === 'student') {
            filter.isActive = true;
        }

        if (req.query.category) {
            filter.category = { $regex: req.query.category, $options: 'i' };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [templates, total] = await Promise.all([
            FormTemplate.find(filter)
                .populate('uploadedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            FormTemplate.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: {
                templates,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload a new form template
// @route   POST /api/v1/form-templates
// @access  Admin only
const createFormTemplate = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File is required' });
        }

        const { name, description, category } = req.body;
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Template name is required (min 3 chars)' });
        }

        const template = await FormTemplate.create({
            name: name.trim(),
            description: description || '',
            category: category || 'General',
            filePath: req.file.path,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
        });

        // Notify all students about new template (non-critical, wrapped in try/catch)
        try {
            const students = await User.find({ role: 'student', isActive: true }).select('_id').lean();
            const notifications = students.map((s) => ({
                recipientId: s._id,
                senderId: req.user._id,
                type: 'FORM_UPLOADED',
                title: 'New Form Template Available',
                message: `A new form template "${name}" is now available for download.`,
                relatedId: template._id,
                relatedModel: 'FormTemplate',
                link: '/form-templates',
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            await ActivityLog.create({
                userId: req.user._id,
                action: 'FORM_TEMPLATE_CREATED',
                target: `Template: ${name} (${template._id})`,
            });
        } catch (notifierError) {
            console.warn(`Failed to generate notifications or activity logs for template upload:`, notifierError.message);
        }

        const populated = await template.populate('uploadedBy', 'name email');
        res.status(201).json({
            success: true,
            message: 'Form template uploaded successfully',
            data: { template: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download a form template
// @route   GET /api/v1/form-templates/:id/download
// @access  Private (all roles)
const downloadFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        const normalizePath = (p) => path.resolve(p).replace(/\\/g, '/');
        const resolvedPath = path.resolve(template.filePath);
        const templatesDir = normalizePath(path.join(__dirname, '../../../uploads/templates'));
        const normalizedResolved = normalizePath(resolvedPath);

        if (!normalizedResolved.startsWith(templatesDir)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ success: false, message: 'File not found on disk' });
        }

        // Increment download count only on real downloads (not preview)
        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        if (disposition === 'attachment') {
            template.downloadCount += 1;
            await template.save();
        }

        // Set headers for inline (preview) or attachment (download)
        res.setHeader('Content-Type', template.fileType || 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(template.originalName)}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');

        const fs2 = require('fs');
        const fileStream = fs2.createReadStream(resolvedPath);
        fileStream.on('error', (err) => next(err));
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
};

// @desc    Update template metadata
// @route   PUT /api/v1/form-templates/:id
// @access  Admin only
const updateFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        const { name, description, category, isActive } = req.body;
        if (name) template.name = name.trim();
        if (description !== undefined) template.description = description;
        if (category) template.category = category;
        if (isActive !== undefined) template.isActive = isActive;

        // Replace file if uploaded
        if (req.file) {
            // Delete old file
            try {
                if (fs.existsSync(template.filePath)) fs.unlinkSync(template.filePath);
            } catch (err) {
                console.warn(`Could not delete old template file: ${template.filePath}`, err.message);
            }
            template.filePath = req.file.path;
            template.originalName = req.file.originalname;
            template.fileType = req.file.mimetype;
            template.fileSize = req.file.size;
        }

        await template.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'FORM_TEMPLATE_UPDATED',
            target: `Template: ${template.name} (${template._id})`,
        });

        const populated = await template.populate('uploadedBy', 'name email');
        res.json({
            success: true,
            message: 'Template updated successfully',
            data: { template: populated },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete form template
// @route   DELETE /api/v1/form-templates/:id
// @access  Admin only
const deleteFormTemplate = async (req, res, next) => {
    try {
        const template = await FormTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        // Delete file from disk
        try {
            if (fs.existsSync(template.filePath)) fs.unlinkSync(template.filePath);
        } catch (err) {
            console.warn(`Could not delete template file from disk: ${template.filePath}`, err.message);
        }

        const templateName = template.name;
        await template.deleteOne();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'FORM_TEMPLATE_DELETED',
            target: `Template: ${templateName} (${req.params.id})`,
        });

        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFormTemplates,
    createFormTemplate,
    downloadFormTemplate,
    updateFormTemplate,
    deleteFormTemplate,
};
