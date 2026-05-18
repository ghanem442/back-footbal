import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

/**
 * Storage Service
 * 
 * Provides file storage using Cloudinary only.
 * Local file storage has been removed to prevent 404 errors.
 * 
 * Requirements: 24.5
 */
@Injectable()
export class StorageService implements StorageProvider {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryProvider: CloudinaryStorageProvider,
  ) {
    const providerType = this.configService.get<string>(
      'STORAGE_PROVIDER',
      'cloudinary',
    ).toLowerCase();

    if (providerType !== 'cloudinary') {
      this.logger.warn(
        `Storage provider "${providerType}" is not supported. Using Cloudinary only.`,
      );
    }

    this.provider = this.cloudinaryProvider;
    this.logger.log('Using Cloudinary Storage Provider (only supported provider)');
  }

  /**
   * Upload a file using Cloudinary
   */
  async upload(
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    return this.provider.upload(file, filename, mimeType);
  }

  /**
   * Delete a file from Cloudinary
   */
  async delete(url: string): Promise<void> {
    return this.provider.delete(url);
  }

  /**
   * Get a signed URL from Cloudinary
   */
  async getSignedUrl(url: string, expiresIn: number): Promise<string> {
    return this.provider.getSignedUrl(url, expiresIn);
  }

  /**
   * Generate a signature for client-side Cloudinary uploads
   */
  generateCloudinarySignature(params: Record<string, any>): string {
    if (!(this.provider instanceof CloudinaryStorageProvider)) {
      throw new Error('Signature generation is only available with Cloudinary storage provider');
    }
    return this.provider.generateSignature(params);
  }

  /**
   * Get Cloudinary configuration for client-side uploads
   */
  getCloudinaryUploadConfig(): { cloudName: string; apiKey: string } {
    if (!(this.provider instanceof CloudinaryStorageProvider)) {
      throw new Error('Cloudinary config is only available with Cloudinary storage provider');
    }
    return this.provider.getUploadConfig();
  }
}
