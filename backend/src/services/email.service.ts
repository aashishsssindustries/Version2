import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import config from '../config/env';
import logger from '../config/logger';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    /**
     * Initialize email transporter with Gmail SMTP configuration
     */
    private static getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            const smtpHost = config.get('SMTP_HOST');
            const smtpPort = config.get('SMTP_PORT');
            const smtpUser = config.get('SMTP_USER');
            const smtpPass = config.get('SMTP_PASS');

            // Check if email is configured
            if (!smtpUser || !smtpPass) {
                logger.warn('Email credentials not configured. Emails will be logged to console only.');
                // Return a mock transporter for development
                this.transporter = nodemailer.createTransport({
                    streamTransport: true,
                    newline: 'unix',
                    buffer: true
                });
            } else {
                const transportOptions: SMTPTransport.Options = {
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465, // true for 465, false for other ports
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                };
                this.transporter = nodemailer.createTransport(transportOptions);
            }
        }
        return this.transporter;
    }

    /**
     * Send OTP email to user
     */
    static async sendOTPEmail(email: string, otp: string, name?: string): Promise<void> {
        const transporter = this.getTransporter();
        const emailFrom = config.get('EMAIL_FROM');

        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: 'Email Verification - WealthMax',
            html: this.getOTPEmailTemplate(otp, name),
            text: `Your WealthMax email verification OTP is: ${otp}. This OTP is valid for 5 minutes.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            // Log for development
            if (!config.get('SMTP_USER')) {
                logger.info(`[DEV MODE] Email would be sent to: ${email}`);
                logger.info(`[DEV MODE] OTP: ${otp}`);
            } else {
                logger.info(`Email sent successfully to ${email}: ${info.messageId}`);
            }
        } catch (error) {
            logger.error('Failed to send email:', error);
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    /**
     * HTML email template for OTP
     */
    private static getOTPEmailTemplate(otp: string, name?: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - WealthMax</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">WealthMax</h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Your Financial Advisor</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Email Verification
                            </h2>
                            
                            ${name ? `<p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${name},</p>` : ''}
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for signing up with WealthMax! To complete your email verification, please use the following One-Time Password (OTP):
                            </p>
                            
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px 40px; display: inline-block;">
                                            <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                This OTP is valid for <strong>5 minutes</strong>
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>Security Note:</strong> If you didn't request this verification, please ignore this email or contact our support team immediately.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at <a href="mailto:support@wealthmax.com" style="color: #667eea; text-decoration: none;">support@wealthmax.com</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} WealthMax. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }
}
