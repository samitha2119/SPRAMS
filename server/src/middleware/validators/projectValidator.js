const { body } = require('express-validator');
const { handleValidationErrors } = require('../errorHandler');

const baseValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 300 }).withMessage('Title must be between 5 and 300 characters'),
    body('department')
        .trim()
        .isLength({ max: 150 }),
    body('academicYear')
        .trim()
        .matches(/^\d{4}\/\d{4}$/).withMessage('Academic year must be in YYYY/YYYY format'),
    body('groupName')
        .trim()
        .isLength({ max: 100 }),
    body('supervisor')
        .trim()
        .isLength({ max: 150 }),
    body('abstract')
        .trim()
        .isLength({ min: 50, max: 5000 }).withMessage('Abstract must be between 50 and 5000 characters'),
];

const projectValidation = [
    ...baseValidation.map(v => v.notEmpty().withMessage(`${v.builder.fields[0]} is required`)),
    handleValidationErrors,
];

const projectUpdateValidation = [
    ...baseValidation.map(v => v.optional()),
    handleValidationErrors,
];

module.exports = { projectValidation, projectUpdateValidation };
