import {
  Controller,
  Post,
  Get,
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
import { PrismaService } from '@modules/prisma/prisma.service';
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
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Get Cloudinary upload signature
   * GET /uploads/cloudinary/signature
   * 
   * Returns signature and configuration for client-side Cloudinary uploads
   * This keeps the API secret safe on the server
   */
  @Get('cloudinary/signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Cloudinary upload signature',
    description: 'Get signature and configuration for direct client-side uploads to Cloudinary',
  })
  async getCloudinarySignature() {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'payment-proofs';

      const signature = this.storageService.generateCloudinarySignature({
        timestamp,
        folder,
      });

      const config = this.storageService.getCloudinaryUploadConfig();

      return {
        success: true,
        data: {
          signature,
          timestamp,
          folder,
          cloudName: config.cloudName,
          apiKey: config.apiKey,
        },
        message: {
          en: 'Cloudinary signature generated successfully',
          ar: 'تم إنشاء توقيع Cloudinary بنجاح',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Upload payment proof screenshot (Legacy - for backward compatibility)
   * POST /uploads/payment-proof
   * 
   * Accepts multipart/form-data with:
   * - file: The screenshot file (required)
   * - paymentId: The payment ID (required)
   */
  @Post('payment-proof')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload payment proof screenshot (Legacy)',
    description: 'Upload a payment screenshot for manual verification (InstaPay, etc.). Consider using client-side upload with /cloudinary/signature instead.',
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

  /**
   * Confirm payment proof URL (Client-side upload)
   * POST /uploads/payment-proof/confirm
   * 
   * Accepts JSON with:
   * - url: The Cloudinary URL (required)
   * - paymentId: The payment ID (required)
   * 
   * This endpoint is used after the client uploads directly to Cloudinary
   */
  @Post('payment-proof/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm payment proof URL',
    description: 'Confirm and save the Cloudinary URL after client-side upload',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['url', 'paymentId'],
      properties: {
        url: {
          type: 'string',
          description: 'Cloudinary URL of the uploaded image',
          example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/payment-proofs/abc123.jpg',
        },
        paymentId: {
          type: 'string',
          description: 'Payment ID',
          example: 'uuid-here',
        },
      },
    },
  })
  async confirmPaymentProofUrl(
    @Body() body: { url: string; paymentId: string },
  ) {
    // Validate URL
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    // Validate paymentId
    if (!body.paymentId) {
      throw new BadRequestException('paymentId is required');
    }

    // Validate it's actually a Cloudinary URL
    if (!body.url.includes('cloudinary.com')) {
      throw new BadRequestException('Invalid image URL. Must be a Cloudinary URL.');
    }

    try {
      // Update payment with the proof image URL
      await this.prismaService.payment.update({
        where: { id: body.paymentId },
        data: { proofImageUrl: body.url },
      });

      return {
        success: true,
        data: {
          url: body.url,
          paymentId: body.paymentId,
        },
        message: {
          en: 'Payment proof URL confirmed successfully',
          ar: 'تم تأكيد رابط إثبات الدفع بنجاح',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update payment: ${errorMessage}`);
    }
  }
}
