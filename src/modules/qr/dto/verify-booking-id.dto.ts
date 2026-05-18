import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyBookingIdDto {
  @ApiProperty({
    description: 'Booking ID to verify',
    example: 'clh1234567890',
  })
  @IsNotEmpty()
  @IsString()
  bookingId!: string;

  @ApiProperty({
    description: 'Field ID (optional, for context)',
    example: 'clh1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  fieldId?: string;
}
