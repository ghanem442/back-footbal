import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Cloudinary Service
 * 
 * Handles Cloudinary signature generation for client-side uploads
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate a signature for client-side Cloudinary uploads
   * This allows Flutter to upload directly to Cloudinary without exposing the API secret
   */
  generateSignature(params: Record<string, any>): string {
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!apiSecret) {
      throw new Error('CLOUDINARY_API_SECRET is not configured');
    }

    try {
      // Sort params alphabetically and create string
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // Sign with API secret
      const signature = crypto
        .createHash('sha256')
        .update(sortedParams + apiSecret)
        .digest('hex');

      this.logger.log('Generated Cloudinary upload signature');

      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate Cloudinary signature: ${errorMessage}`);
      throw new Error(`Cloudinary signature generation failed: ${errorMessage}`);
    }
  }

  /**
   * Get Cloudinary configuration for client-side uploads
   */
  getUploadConfig(): { cloudName: string; apiKey: string } {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');

    if (!cloudName || !apiKey) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY');
    }

    return {
      cloudName,
      apiKey,
    };
  }
}
