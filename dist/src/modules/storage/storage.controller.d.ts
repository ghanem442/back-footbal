import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@modules/prisma/prisma.service';
export declare class StorageController {
    private readonly storageService;
    private readonly configService;
    private readonly prismaService;
    constructor(storageService: StorageService, configService: ConfigService, prismaService: PrismaService);
    getCloudinarySignature(): Promise<{
        success: boolean;
        data: {
            signature: string;
            timestamp: number;
            folder: string;
            cloudName: string;
            apiKey: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    uploadPaymentProof(file: Express.Multer.File, paymentId: string): Promise<{
        success: boolean;
        data: {
            url: string;
            screenshotUrl: string;
            paymentId: string;
            filename: string;
            size: number;
            mimeType: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    confirmPaymentProofUrl(body: {
        url: string;
        paymentId: string;
    }): Promise<{
        success: boolean;
        data: {
            url: string;
            paymentId: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
}
