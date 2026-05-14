import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadScreenshotDto {
  @ApiProperty({
    description: 'URL of the uploaded payment screenshot (Firebase Storage or any HTTPS URL)',
    example: 'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/payment_proofs%2Fscreenshot.jpg?alt=media&token=abc123',
  })
  @IsString()
  @IsNotEmpty()
  screenshotUrl: string;

  @ApiPropertyOptional({
    description: 'Optional notes or comments about the payment',
    example: 'Paid via InstaPay from account ending in 1234',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Optional transaction ID from the payment provider',
    example: 'TXN-123456789',
  })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Optional sender phone number or account identifier',
    example: '01012345678',
  })
  @IsString()
  @IsOptional()
  senderNumber?: string;
}
