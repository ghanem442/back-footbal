import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

/**
 * Storage Controller
 * 
 * Handles file upload endpoints for payment proofs and other documents
 */
@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload payment proof screenshot
   * POST /uploads/payment-proof
   * 
   * Accepts multipart/form-data with:
   * - file: The screenshot file (required)
   * - paymentId: The payment ID (required)
   */
  @Post('payment-proof')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload payment proof screenshot',
    description: 'Upload a payment screenshot for manual verification (InstaPay, etc.)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'paymentId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment screenshot image file',
        },
        paymentId: {
          type: 'string',
          description: 'Payment ID',
          example: 'uuid-here',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentProof(
    @UploadedFile() file: Express.Multer.File,
    @Body('paymentId') paymentId: string,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate paymentId
    if (!paymentId) {
      throw new BadRequestException('paymentId is required');
    }

    // Validate file type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `payment-proof/${paymentId}-${timestamp}${ext}`;

    // Upload file
    const url = await this.storageService.upload(
      file.buffer,
      filename,
      file.mimetype,
    );

    return {
      success: true,
      data: {
        url,
        screenshotUrl: url, // Alternative field name for compatibility
        paymentId,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      message: {
        en: 'Payment proof uploaded successfully',
        ar: 'تم رفع إثبات الدفع بنجاح',
      },
    };
  }
}
