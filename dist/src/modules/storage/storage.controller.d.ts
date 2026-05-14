import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
export declare class StorageController {
    private readonly storageService;
    private readonly configService;
    constructor(storageService: StorageService, configService: ConfigService);
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
}
