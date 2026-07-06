const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
let transporter = null;

const initTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        logger.info('📧 SMTP transporter initialized successfully.');
    } else {
        logger.info('📧 SMTP credentials not configured. Email service will run in MOCK mode (logging to console).');
    }
};

initTransporter();

/**
 * Send an email
 * @param {Object} options 
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.text
 * @param {string} options.html
 */
const sendEmail = async (options) => {
    try {
        if (!transporter) {
            logger.info('--- MOCK EMAIL DISPATCH ---');
            logger.info(`To: ${options.to}`);
            logger.info(`Subject: ${options.subject}`);
            logger.info(`Text Body: ${options.text}`);
            logger.info('---------------------------');
            return { mock: true, messageId: 'mock-id-' + Date.now() };
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"SPRAMS University of Vavuniya" <noreply@uov.ac.lk>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`📧 Email sent to ${options.to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`❌ Failed to send email to ${options.to}:`, error);
        // Do not throw to avoid crashing the server on email failure
        return null;
    }
};

/**
 * Send approval email to a user
 * @param {string} email 
 * @param {string} name 
 */
const sendApprovalEmail = async (email, name) => {
    const subject = 'Account Approved - SPRAMS';
    const text = `Dear ${name},\n\nYour account has been approved by the administrator. You can now log in to the Student Project & Research Archive Management System (SPRAMS) using your registered email and password.\n\nBest regards,\nSPRAMS Admin Team\nUniversity of Vavuniya`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">Account Approved</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your registration request has been approved by the system administrator.</p>
            <p>You now have full access to the <strong>Student Project & Research Archive Management System (SPRAMS)</strong> of the University of Vavuniya.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log in to SPRAMS</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
                This is an automated system notification. Please do not reply to this email.
            </p>
        </div>
    `;

    return await sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendApprovalEmail,
};
