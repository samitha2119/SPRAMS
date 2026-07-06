const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`📚 API Base: http://localhost:${PORT}/api/v1`);
    logger.info(`🌐 App UI: http://localhost:${PORT} (when client/dist is built)`);
});
