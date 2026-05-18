import { AppConfigService } from '@config/config.service';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: AppConfigService);
    private initializeTransporter;
    private getTransporter;
    sendEmailVerification(email: string, verificationToken: string): Promise<void>;
    private logVerificationEmail;
    sendPasswordResetOtp(email: string, otp: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetToken: string, resetUrl?: string): Promise<void>;
    private logEmail;
    sendPasswordResetConfirmation(email: string): Promise<void>;
    private logConfirmationEmail;
}
