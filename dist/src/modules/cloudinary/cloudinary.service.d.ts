import { ConfigService } from '@nestjs/config';
export declare class CloudinaryService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    generateSignature(params: Record<string, any>): string;
    getUploadConfig(): {
        cloudName: string;
        apiKey: string;
    };
}
