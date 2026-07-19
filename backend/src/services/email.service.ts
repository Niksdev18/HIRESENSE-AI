import nodemailer from 'nodemailer';

export interface IEmailService {
  sendMail(to: string, subject: string, htmlContent: string): Promise<boolean>;
}

// Console fallback when SMTP credentials are not configured
export class ConsoleEmailService implements IEmailService {
  async sendMail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    console.log(`✉️ [ConsoleMail] Sending email to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${htmlContent}`);
    return true;
  }
}

// Standard SMTP mail pipeline
export class SmtpEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendMail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"HireSense AI" <${process.env.SMTP_FROM || 'noreply@hiresense.ai'}>`,
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err) {
      console.error('SMTP Mail send failed. Falling back to console logging:', err);
      // Fallback log instead of crashing server
      const consoleService = new ConsoleEmailService();
      return await consoleService.sendMail(to, subject, htmlContent);
    }
  }
}

export class EmailServiceFactory {
  static getService(): IEmailService {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return new SmtpEmailService();
    }
    return new ConsoleEmailService();
  }
}
