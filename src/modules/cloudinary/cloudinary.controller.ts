import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';

/**
 * Cloudinary Controller
 * 
 * Handles Cloudinary signature generation for client-side uploads
 */
@ApiTags('Cloudinary')
@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Get Cloudinary upload signature
   * GET /cloudinary/signature
   * 
   * Returns signature and configuration for client-side Cloudinary uploads
   * This keeps the API secret safe on the server
   */
  @Get('signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Cloudinary upload signature',
    description: 'Get signature and configuration for direct client-side uploads to Cloudinary',
  })
  async getUploadSignature(@CurrentUser() user: any) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'payment-proofs';

      const signature = this.cloudinaryService.generateSignature({
        timestamp,
        folder,
      });

      const config = this.cloudinaryService.getUploadConfig();

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
}
