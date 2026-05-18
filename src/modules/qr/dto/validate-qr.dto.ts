import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateQrDto {
  @ApiProperty({
    description: 'QR code token to validate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  qrToken!: string;

  @ApiProperty({
    description: 'Field ID (optional, for context)',
    example: 'clh1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  fieldId?: string;
}
