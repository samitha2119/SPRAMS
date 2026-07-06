const { validationResult } = require('express-validator');

// Middleware to handle validation errors from express-validator
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

const logger = require('../utils/logger');
// ... other imports

// Generic error handler middleware
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        statusCode = 409;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map((e) => e.message).join(', ');
        statusCode = 400;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        message = `Invalid ${err.path}: ${err.value}`;
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    logger.error('API Error: %s', message, {
        statusCode,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { handleValidationErrors, errorHandler };
