import { CloudinaryService } from './cloudinary.service';
export declare class CloudinaryController {
    private readonly cloudinaryService;
    constructor(cloudinaryService: CloudinaryService);
    getUploadSignature(user: any): Promise<{
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
}
