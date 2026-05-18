import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
export declare class StorageService implements StorageProvider {
    private readonly configService;
    private readonly cloudinaryProvider;
    private readonly logger;
    private readonly provider;
    constructor(configService: ConfigService, cloudinaryProvider: CloudinaryStorageProvider);
    upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
    delete(url: string): Promise<void>;
    getSignedUrl(url: string, expiresIn: number): Promise<string>;
    generateCloudinarySignature(params: Record<string, any>): string;
    getCloudinaryUploadConfig(): {
        cloudName: string;
        apiKey: string;
    };
}
