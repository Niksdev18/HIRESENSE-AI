"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceFactory = exports.SmtpEmailService = exports.ConsoleEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Console fallback when SMTP credentials are not configured
class ConsoleEmailService {
    async sendMail(to, subject, htmlContent) {
        console.log(`✉️ [ConsoleMail] Sending email to ${to}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${htmlContent}`);
        return true;
    }
}
exports.ConsoleEmailService = ConsoleEmailService;
// Standard SMTP mail pipeline
class SmtpEmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }
    async sendMail(to, subject, htmlContent) {
        try {
            await this.transporter.sendMail({
                from: `"HireSense AI" <${process.env.SMTP_FROM || 'noreply@hiresense.ai'}>`,
                to,
                subject,
                html: htmlContent,
            });
            return true;
        }
        catch (err) {
            console.error('SMTP Mail send failed. Falling back to console logging:', err);
            // Fallback log instead of crashing server
            const consoleService = new ConsoleEmailService();
            return await consoleService.sendMail(to, subject, htmlContent);
        }
    }
}
exports.SmtpEmailService = SmtpEmailService;
class EmailServiceFactory {
    static getService() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            return new SmtpEmailService();
        }
        return new ConsoleEmailService();
    }
}
exports.EmailServiceFactory = EmailServiceFactory;
