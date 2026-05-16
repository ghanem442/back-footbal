import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { PrismaModule } from '@modules/prisma/prisma.module';

/**
 * Storage Module
 * 
 * Provides file storage abstraction with support for multiple providers:
 * - Local filesystem storage
 * - AWS S3 storage
 * - Cloudinary storage
 * 
 * The active provider is selected via the STORAGE_PROVIDER environment variable.
 * 
 * Requirements: 24.4, 24.5, 24.6
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    LocalStorageProvider,
    S3StorageProvider,
    CloudinaryStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}
