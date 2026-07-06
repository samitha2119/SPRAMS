const logger = require('../utils/logger');

/**
 * Validate that all required environment variables are set.
 * Crashes the process if critical variables are missing.
 */
const validateEnv = () => {
    const required = [
        'MONGO_URI',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'ANTHROPIC_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error('CRITICAL: Missing environment variables: %s', missing.join(', '));
        logger.error('The server cannot start without these internal configurations.');
        process.exit(1);
    }

    logger.info('Environment validation successful.');
};

module.exports = { validateEnv };
