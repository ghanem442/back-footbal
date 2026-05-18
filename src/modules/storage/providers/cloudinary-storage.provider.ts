import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Cloudinary Storage Provider
 * 
 * Stores files in Cloudinary using the Cloudinary SDK.
 * Provides image optimization and transformation capabilities.
 * 
 * Requirements: 24.5
 * 
 * Installation: npm install cloudinary
 */
@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private readonly cloudinary: any;
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
    this.isConfigured = !!(this.cloudName && apiKey && apiSecret);

    if (this.isConfigured) {
      try {
        // Dynamically import Cloudinary SDK
        const cloudinary = require('cloudinary').v2;
        
        cloudinary.config({
          cloud_name: this.cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });
        
        this.cloudinary = cloudinary;
        this.logger.log('Cloudinary storage provider initialized successfully');
      } catch (error) {
        this.logger.warn(
          'Cloudinary SDK not installed. Install cloudinary package to use Cloudinary storage: npm install cloudinary',
        );
        this.isConfigured = false;
      }
    } else {
      this.logger.warn(
        'Cloudinary storage not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      );
    }
  }

  /**
   * Upload a file to Cloudinary
   */
  async upload(
    file: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary storage is not configured');
      throw new InternalServerErrorException(
        'Storage service is not configured. Please contact support.',
      );
    }

    try {
      // Generate unique public ID
      const publicId = `football-fields/${uuidv4()}`;

      this.logger.log(`Uploading file to Cloudinary: ${filename} (${mimeType})`);

      const result = await this.cloudinary.uploader.upload(
        `data:${mimeType};base64,${file.toString('base64')}`,
        {
          public_id: publicId,
          resource_type: 'auto',
        },
      );

      // Return secure URL
      const url = result.secure_url;
      this.logger.log(`File uploaded successfully to Cloudinary: ${url}`);

      return url;
    } catch (error) {
      // Log detailed error information for debugging
      this.logger.error(
        `Cloudinary upload failed for file: ${filename}`,
        error instanceof Error ? error.stack : error,
      );

      // Extract meaningful error message from Cloudinary error
      let errorMessage = 'Image upload failed';
      if (error instanceof Error) {
        // Cloudinary errors often have specific error codes
        const cloudinaryError = error as any;
        if (cloudinaryError.http_code) {
          errorMessage = `Upload failed (HTTP ${cloudinaryError.http_code}): ${cloudinaryError.message || 'Unknown error'}`;
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }

      // Throw user-friendly error
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async delete(url: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary storage is not configured');
      throw new InternalServerErrorException(
        'Storage service is not configured. Please contact support.',
      );
    }

    try {
      // Extract public ID from URL
      const publicId = this.extractPublicIdFromUrl(url);

      this.logger.log(`Deleting file from Cloudinary: ${publicId}`);

      await this.cloudinary.uploader.destroy(publicId);

      this.logger.log(`File deleted successfully from Cloudinary: ${publicId}`);
    } catch (error) {
      // Log detailed error but don't throw - deletion failures shouldn't break the flow
      this.logger.error(
        `Failed to delete file from Cloudinary: ${url}`,
        error instanceof Error ? error.stack : error,
      );
      
      // Optionally throw if you want deletion failures to be critical
      // For now, we'll log and continue since the file might already be deleted
      // throw new InternalServerErrorException('File deletion failed');
    }
  }

  /**
   * Get a signed URL for temporary Cloudinary access
   */
  async getSignedUrl(url: string, expiresIn: number): Promise<string> {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary storage is not configured');
      throw new InternalServerErrorException(
        'Storage service is not configured. Please contact support.',
      );
    }

    try {
      // Extract public ID from URL
      const publicId = this.extractPublicIdFromUrl(url);

      // Calculate expiration timestamp
      const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;

      const signedUrl = this.cloudinary.url(publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: expirationTime,
      });

      this.logger.log(`Generated signed URL for Cloudinary (expires in ${expiresIn}s)`);

      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate Cloudinary signed URL for: ${url}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  private extractPublicIdFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the index of 'upload' in the path
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Public ID is everything after 'upload' and version (if present)
      const publicIdParts = pathParts.slice(uploadIndex + 1);
      
      // Remove version if present (starts with 'v' followed by numbers)
      if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
        publicIdParts.shift();
      }

      // Join remaining parts and remove file extension
      const publicIdWithExt = publicIdParts.join('/');
      const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

      return publicId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract public ID from URL: ${errorMessage}`);
    }
  }

  /**
   * Generate a signature for client-side Cloudinary uploads
   * This allows Flutter to upload directly to Cloudinary without exposing the API secret
   */
  generateSignature(params: Record<string, any>): string {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary storage is not configured');
      throw new InternalServerErrorException(
        'Storage service is not configured. Please contact support.',
      );
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
        .update(sortedParams + this.apiSecret)
        .digest('hex');

      this.logger.log('Generated Cloudinary upload signature');

      return signature;
    } catch (error) {
      this.logger.error(
        'Failed to generate Cloudinary signature',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to generate upload signature');
    }
  }

  /**
   * Get Cloudinary configuration for client-side uploads
   */
  getUploadConfig(): { cloudName: string; apiKey: string } {
    if (!this.isConfigured) {
      this.logger.error('Cloudinary storage is not configured');
      throw new InternalServerErrorException(
        'Storage service is not configured. Please contact support.',
      );
    }

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
    };
  }
}
