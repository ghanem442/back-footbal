import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { PrismaModule } from '@modules/prisma/prisma.module';

/**
 * Storage Module
 * 
 * Provides file storage using Cloudinary only.
 * Local file storage has been removed to prevent 404 errors and ensure
 * all images are served from Cloudinary's CDN.
 * 
 * Requirements: 24.5
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    CloudinaryStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}
