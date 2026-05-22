import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { VerifyBookingIdDto } from './dto/verify-booking-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingStatus } from '@prisma/client';

/**
 * Returns the current calendar date string (YYYY-MM-DD) in Egypt local time.
 *
 * Uses the IANA timezone 'Africa/Cairo' via the Intl API so that any future
 * DST changes are handled automatically by the runtime — no hard-coded offsets.
 *
 * Egypt abolished DST in 2011 and is currently always UTC+2, but using the
 * named timezone keeps the code correct if that policy ever changes.
 */
function toEgyptDateString(date: Date): string {
  // 'en-CA' locale produces the ISO-style YYYY-MM-DD format, which is safe
  // for string equality comparisons without any further parsing.
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

@ApiTags('QR Codes')
@Controller('qr')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class QrController {
  constructor(
    private readonly qrService: QrService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('booking/:bookingId')
  @Roles(Role.PLAYER)
  @ApiOperation({
    summary: 'Get QR code for a booking',
    description: 'Players can retrieve the QR code for their confirmed booking',
  })
  @ApiParam({ name: 'bookingId', type: String, description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          qrToken: 'qr_abc123xyz',
          qrImageUrl: 'https://example.com/qr/abc123.png',
          isUsed: false,
          bookingId: 'bk_123abc',
          booking: {
            id: 'bk_123abc',
            bookingNumber: 'BK-2024-001',
            status: 'CONFIRMED',
            scheduledDate: '2024-01-15',
            scheduledStartTime: '14:00:00',
            scheduledEndTime: '16:00:00',
            field: {
              name: 'Champions Field',
              address: '123 Sports St',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own bookings',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking or QR code not found',
  })
  async getQrCode(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        qrCode: true,
        payment: true,
        field: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Ensure the player can only access their own booking's QR
    if (booking.playerId !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if payment is approved (COMPLETED status)
    if (booking.payment && booking.payment.status !== 'COMPLETED') {
      throw new ForbiddenException({
        code: 'PAYMENT_NOT_APPROVED',
        message: {
          en: 'Payment not yet approved by admin',
          ar: 'لم تتم الموافقة على الدفع من قبل المسؤول بعد',
        },
        paymentStatus: booking.payment.status,
      });
    }

    if (!booking.qrCode) {
      throw new NotFoundException('QR code not found for this booking');
    }

    return {
      success: true,
      data: {
        qrToken: booking.qrCode.qrToken,
        qrImageUrl: booking.qrCode.imageUrl,
        isUsed: booking.qrCode.isUsed,
        usedAt: booking.qrCode.usedAt,
        bookingId: booking.id,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          scheduledDate: booking.scheduledDate,
          scheduledStartTime: booking.scheduledStartTime.toISOString().substring(11, 16), // "09:00"
          scheduledEndTime: booking.scheduledEndTime.toISOString().substring(11, 16),     // "10:00"
          field: booking.field,
        },
      },
      message: {
        en: 'QR code retrieved successfully',
        ar: 'تم استرجاع رمز الاستجابة السريعة بنجاح',
      },
    };
  }

  @Post('validate')
  @Roles(Role.FIELD_OWNER)
  @ApiOperation({
    summary: 'Validate QR code',
    description: 'Field owners can scan and validate a booking QR code for check-in. Updates booking status to CHECKED_IN.',
  })
  @ApiBody({ type: ValidateQrDto })
  @ApiResponse({
    status: 200,
    description: 'QR code validated successfully',
    schema: {
      example: {
        success: true,
        message: 'Booking validated successfully',
        data: {
          bookingId: 'bk_123abc',
          status: 'CHECKED_IN',
          playerName: 'player@example.com',
          fieldName: 'Champions Field',
          scheduledStartTime: '14:00:00',
          scheduledEndTime: '16:00:00',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'QR code already used or booking not valid for today',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only validate bookings for own fields',
  })
  @ApiResponse({
    status: 404,
    description: 'QR code not found',
  })
  async validateQrCode(
    @Body() validateQrDto: ValidateQrDto,
    @CurrentUser() user: any,
  ) {
    const { qrToken } = validateQrDto;

    // Retrieve QR code with booking details
    const qrCode = await this.qrService.getQrCodeByToken(qrToken);

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    // Check if QR code is already used
    if (qrCode.isUsed) {
      throw new BadRequestException('QR code has already been used');
    }

    const { booking } = qrCode;

    // Validate booking status is CONFIRMED
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking status is ${booking.status}, expected CONFIRMED`,
      );
    }

    // Validate scheduled date matches today in Egypt local time.
    // Using 'Africa/Cairo' via the Intl API automatically accounts for any
    // DST changes Egypt may introduce in the future (currently UTC+2 all year).
    const todayEgypt = toEgyptDateString(new Date());
    const scheduledEgypt = toEgyptDateString(new Date(booking.scheduledDate));

    if (todayEgypt !== scheduledEgypt) {
      throw new BadRequestException('Booking is not scheduled for today');
    }

    // Validate field belongs to authenticated owner
    if (booking.field.ownerId !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to validate this booking',
      );
    }

    // Update booking status to CHECKED_IN
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CHECKED_IN },
    });

    // Record status change in history
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: BookingStatus.CONFIRMED,
        toStatus: BookingStatus.CHECKED_IN,
        reason: 'QR code validated by field owner',
      },
    });

    // Mark QR code as used
    await this.qrService.markQrCodeAsUsed(qrToken);

    return {
      success: true,
      message: 'Booking validated successfully',
      data: {
        bookingId: booking.id,
        status: BookingStatus.CHECKED_IN,
        playerName: booking.player.email,
        fieldName: booking.field.name,
        scheduledStartTime: booking.scheduledStartTime.toISOString().substring(11, 16), // "09:00"
        scheduledEndTime: booking.scheduledEndTime.toISOString().substring(11, 16),     // "10:00"
      },
    };
  }

  @Post('verify-booking-id')
  @Roles(Role.FIELD_OWNER)
  @ApiOperation({
    summary: 'Verify booking by ID',
    description: 'Field owners can manually verify a booking using booking ID when QR scanning is unavailable. Updates booking status to CHECKED_IN.',
  })
  @ApiBody({ type: VerifyBookingIdDto })
  @ApiResponse({
    status: 200,
    description: 'Booking verified successfully',
    schema: {
      example: {
        success: true,
        message: 'Booking verified successfully',
        data: {
          bookingId: 'bk_123abc',
          status: 'CHECKED_IN',
          playerName: 'player@example.com',
          fieldName: 'Champions Field',
          scheduledStartTime: '14:00:00',
          scheduledEndTime: '16:00:00',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Booking not valid for today or status not CONFIRMED',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only verify bookings for own fields',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async verifyBookingId(
    @Body() verifyBookingIdDto: VerifyBookingIdDto,
    @CurrentUser() user: any,
  ) {
    const { bookingId } = verifyBookingIdDto;

    // Retrieve booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        field: true,
        player: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate field belongs to authenticated owner
    if (booking.field.ownerId !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to verify this booking',
      );
    }

    // Validate booking status is CONFIRMED
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking status is ${booking.status}, expected CONFIRMED`,
      );
    }

    // Validate scheduled date matches today in Egypt local time.
    // Using 'Africa/Cairo' via the Intl API automatically accounts for any
    // DST changes Egypt may introduce in the future (currently UTC+2 all year).
    const todayEgypt = toEgyptDateString(new Date());
    const scheduledEgypt = toEgyptDateString(new Date(booking.scheduledDate));

    if (todayEgypt !== scheduledEgypt) {
      throw new BadRequestException('Booking is not scheduled for today');
    }

    // Update booking status to CHECKED_IN
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CHECKED_IN },
    });

    // Record status change in history
    await this.prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: BookingStatus.CONFIRMED,
        toStatus: BookingStatus.CHECKED_IN,
        reason: 'Booking verified manually by field owner (booking ID)',
      },
    });

    return {
      success: true,
      message: 'Booking verified successfully',
      data: {
        bookingId: booking.id,
        status: BookingStatus.CHECKED_IN,
        playerName: booking.player.email,
        fieldName: booking.field.name,
        scheduledStartTime: booking.scheduledStartTime.toISOString().substring(11, 16), // "09:00"
        scheduledEndTime: booking.scheduledEndTime.toISOString().substring(11, 16),     // "10:00"
      },
    };
  }
}
