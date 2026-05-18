import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
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
    try {
      this.logger.log(`Uploading file: ${filename}`);
      const url = await this.provider.upload(file, filename, mimeType);
      this.logger.log(`File uploaded successfully: ${filename}`);
      return url;
    } catch (error) {
      // Log error and re-throw (provider already throws InternalServerErrorException)
      this.logger.error(
        `Storage upload failed for file: ${filename}`,
        error instanceof Error ? error.stack : error,
      );
      
      // If the error is already an InternalServerErrorException, re-throw it
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Otherwise, wrap it in InternalServerErrorException
      throw new InternalServerErrorException('File upload failed');
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async delete(url: string): Promise<void> {
    try {
      this.logger.log(`Deleting file: ${url}`);
      await this.provider.delete(url);
      this.logger.log(`File deleted successfully: ${url}`);
    } catch (error) {
      // Log error but don't throw - deletion failures shouldn't break the flow
      this.logger.error(
        `Storage deletion failed for file: ${url}`,
        error instanceof Error ? error.stack : error,
      );
      // Optionally re-throw if deletion failures should be critical
      // throw error;
    }
  }

  /**
   * Get a signed URL from Cloudinary
   */
  async getSignedUrl(url: string, expiresIn: number): Promise<string> {
    try {
      return await this.provider.getSignedUrl(url, expiresIn);
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for: ${url}`,
        error instanceof Error ? error.stack : error,
      );
      
      // If the error is already an InternalServerErrorException, re-throw it
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
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
