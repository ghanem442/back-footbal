import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@config/config.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: AppConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter (SMTP or SendGrid)
   */
  private initializeTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.logger.log('✅ SMTP Email service initialized');
    } else {
      this.logger.warn('⚠️ No SMTP configuration found');
    }
  }

  private getTransporter(): nodemailer.Transporter | null {
    if (!this.transporter) {
      this.initializeTransporter();
    }
    return this.transporter;
  }

  /**
   * Send email verification email
   * @param email - Recipient email address
   * @param verificationToken - Email verification token
   */
  async sendEmailVerification(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    // Use API endpoint instead of frontend URL
    const baseUrl = this.configService.get('app.backendUrl') || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/v1/auth/verify-email?token=${verificationToken}`;

    const subject = 'Verify Your Email Address';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Football Booking!</h2>
        <p>Thank you for registering. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
        <p style="color: #999; font-size: 12px;">If you did not create an account, please ignore this email.</p>
      </div>
    `;
    const text = `Welcome to Football Booking! Please verify your email address by visiting: ${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`;

    // Try SMTP first
    if (this.getTransporter()) {
      try {
        const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
        const fromName = process.env.SMTP_FROM_NAME || 'Football Booking';

        await this.getTransporter()!.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: email,
          subject,
          html,
          text,
        });

        this.logger.log(`✅ Email verification sent to ${email} via SMTP`);
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Failed to send email via SMTP: ${errorMessage}`);
      }
    }

    // Fallback to SendGrid
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
    if (sendgridApiKey) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgridApiKey);
        
        const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com';
        const fromName = this.configService.get('SENDGRID_FROM_NAME') || 'Football Booking';

        await sgMail.send({
          to: email,
          from: {
            email: fromEmail,
            name: fromName,
          },
          subject,
          html,
          text,
        });

        this.logger.log(`✅ Email verification sent to ${email} via SendGrid`);
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`❌ Failed to send verification email via SendGrid: ${errorMessage}`);
      }
    }

    // If both failed, log to console
    this.logger.warn('⚠️ No email service configured. Logging email instead.');
    this.logVerificationEmail(email, verifyUrl);
  }

  /**
   * Log verification email to console (fallback)
   */
  private logVerificationEmail(to: string, verifyUrl: string): void {
    this.logger.log(`
      ========================================
      EMAIL (NOT SENT - NO EMAIL SERVICE CONFIGURED)
      ========================================
      To: ${to}
      Subject: Verify Your Email Address
      
      Welcome to Football Booking!
      
      Please verify your email address by clicking the link below:
      ${verifyUrl}
      
      This link will expire in 24 hours.
      
      If you did not create an account, please ignore this email.
      ========================================
    `);
  }

  /**
   * Send OTP password reset email via SMTP
   */
  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
        const fromName = process.env.SMTP_FROM_NAME || 'Football Booking';

        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: email,
          subject: 'Password Reset OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>Use the following OTP to reset your password. It expires in 15 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4CAF50;">${otp}</span>
              </div>
              <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
          text: `Your password reset OTP is: ${otp}\n\nIt expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
        });

        this.logger.log(`✅ OTP email sent to ${email} via SMTP`);
        return;
      } catch (error: any) {
        this.logger.error(`❌ Failed to send OTP email via SMTP: ${error.message}`);
      }
    }

    // Fallback log
    this.logger.warn(`[NO EMAIL SERVICE] OTP for ${email}: ${otp}`);
  }

  /**
   * Send password reset email
   * @param email - Recipient email address
   * @param resetToken - Password reset token
   * @param resetUrl - Full URL for password reset
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    resetUrl?: string,
  ): Promise<void> {
    // Construct reset URL
    const baseUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
    const fullResetUrl = resetUrl || `${baseUrl}/reset-password?token=${resetToken}`;

    // Check if SendGrid is configured
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
    
    if (sendgridApiKey) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgridApiKey);
        
        const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com';
        const fromName = this.configService.get('SENDGRID_FROM_NAME') || 'Football Booking';

        await sgMail.send({
          to: email,
          from: {
            email: fromEmail,
            name: fromName,
          },
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Request</h2>
              <p>You have requested to reset your password.</p>
              <p>Please click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${fullResetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${fullResetUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
              <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
            </div>
          `,
          text: `You have requested to reset your password. Please visit the following link to reset your password: ${fullResetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
        });

        this.logger.log(`Password reset email sent to ${email} via SendGrid`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send email via SendGrid: ${errorMessage}`);
        // Fall back to logging
        this.logEmail(email, 'Password Reset Request', fullResetUrl);
      }
    } else {
      // Log email if SendGrid is not configured
      this.logger.warn('SendGrid not configured. Logging email instead.');
      this.logEmail(email, 'Password Reset Request', fullResetUrl);
    }
  }

  /**
   * Log email to console (fallback when email service is not configured)
   */
  private logEmail(to: string, subject: string, resetUrl: string): void {
    this.logger.log(`
      ========================================
      EMAIL (NOT SENT - NO EMAIL SERVICE CONFIGURED)
      ========================================
      To: ${to}
      Subject: ${subject}
      
      You have requested to reset your password.
      
      Please click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you did not request this, please ignore this email.
      ========================================
    `);
  }

  /**
   * Send password reset confirmation email
   * @param email - Recipient email address
   */
  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
    
    if (sendgridApiKey) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sendgridApiKey);
        
        const fromEmail = this.configService.get('SENDGRID_FROM_EMAIL') || 'noreply@example.com';
        const fromName = this.configService.get('SENDGRID_FROM_NAME') || 'Football Booking';

        await sgMail.send({
          to: email,
          from: {
            email: fromEmail,
            name: fromName,
          },
          subject: 'Password Reset Successful',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Successful</h2>
              <p>Your password has been successfully reset.</p>
              <p>You can now log in with your new password.</p>
              <p style="color: #d32f2f; margin-top: 30px;">⚠️ If you did not make this change, please contact support immediately.</p>
            </div>
          `,
          text: `Your password has been successfully reset.\n\nYou can now log in with your new password.\n\nIf you did not make this change, please contact support immediately.`,
        });

        this.logger.log(`Password reset confirmation email sent to ${email} via SendGrid`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send confirmation email via SendGrid: ${errorMessage}`);
        // Fall back to logging
        this.logConfirmationEmail(email);
      }
    } else {
      this.logger.warn('SendGrid not configured. Logging email instead.');
      this.logConfirmationEmail(email);
    }
  }

  /**
   * Log confirmation email to console (fallback)
   */
  private logConfirmationEmail(to: string): void {
    this.logger.log(`
      ========================================
      EMAIL (NOT SENT - NO EMAIL SERVICE CONFIGURED)
      ========================================
      To: ${to}
      Subject: Password Reset Successful
      
      Your password has been successfully reset.
      
      If you did not make this change, please contact support immediately.
      ========================================
    `);
  }
}
