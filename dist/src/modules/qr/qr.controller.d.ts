import { QrService } from './qr.service';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { VerifyBookingIdDto } from './dto/verify-booking-id.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class QrController {
    private readonly qrService;
    private readonly prisma;
    constructor(qrService: QrService, prisma: PrismaService);
    getQrCode(bookingId: string, user: any): Promise<{
        success: boolean;
        data: {
            qrToken: string;
            qrImageUrl: string;
            isUsed: boolean;
            usedAt: Date | null;
            bookingId: string;
            booking: {
                id: string;
                bookingNumber: string | null;
                status: import(".prisma/client").$Enums.BookingStatus;
                scheduledDate: Date;
                scheduledStartTime: Date;
                scheduledEndTime: Date;
                field: {
                    id: string;
                    name: string;
                    address: string;
                };
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    validateQrCode(validateQrDto: ValidateQrDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            bookingId: string;
            status: "CHECKED_IN";
            playerName: string;
            fieldName: string;
            scheduledStartTime: Date;
            scheduledEndTime: Date;
        };
    }>;
    verifyBookingId(verifyBookingIdDto: VerifyBookingIdDto, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            bookingId: string;
            status: "CHECKED_IN";
            playerName: string;
            fieldName: string;
            scheduledStartTime: Date;
            scheduledEndTime: Date;
        };
    }>;
}
