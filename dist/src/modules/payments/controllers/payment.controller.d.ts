import { RawBodyRequest } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { UploadScreenshotDto } from '../dto/upload-screenshot.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingConfirmationService } from '../../bookings/booking-confirmation.service';
import { JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface';
export declare class PaymentController {
    private readonly paymentService;
    private readonly prisma;
    private readonly bookingConfirmationService;
    constructor(paymentService: PaymentService, prisma: PrismaService, bookingConfirmationService: BookingConfirmationService);
    paymobCallback(req: any, res: any): Promise<any>;
    devConfirmBooking(body: {
        bookingId: string;
    }): Promise<{
        success: boolean;
        data: {
            bookingId: string;
            bookingNumber: string | null;
            status: import(".prisma/client").$Enums.BookingStatus;
        };
        message: string;
    }>;
    initiateDeposit(body: {
        bookingId: string;
        gateway?: string;
    }, user: JwtPayload): Promise<{
        success: boolean;
        data: {
            paymentId: string;
            bookingId: string;
            amount: number;
            currency: string;
            gateway: string;
            redirectUrl: any;
            paymentToken: any;
            iframeId: any;
            reference: string | null;
        };
    } | {
        success: boolean;
        data: {
            paymentId: any;
            bookingId: string;
            amount: number;
            currency: string;
            gateway: string;
            redirectUrl: string | undefined;
            paymentToken: any;
            iframeId: any;
            reference: string;
        };
    }>;
    handlePaymobWebhook(payload: any, hmac?: string): Promise<{
        received: boolean;
    }>;
    initiatePayment(dto: InitiatePaymentDto, user: JwtPayload, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
            paymentId: string;
            transactionId: string | null;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            redirectUrl?: undefined;
        };
        message: string;
    } | {
        success: boolean;
        data: {
            paymentId: string;
            transactionId: string | null;
            status: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            redirectUrl: any;
        };
        message: string;
    } | {
        success: boolean;
        data: {
            paymentId: string;
            transactionId: string;
            status: "SUCCESS" | "PENDING";
            redirectUrl: string | undefined;
            amount: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
        message?: undefined;
    }>;
    handleStripeWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    handleFawryWebhook(payload: any): Promise<{
        received: boolean;
    }>;
    handleVodafoneWebhook(payload: any): Promise<{
        received: boolean;
    }>;
    handleInstaPayWebhook(payload: any): Promise<{
        received: boolean;
    }>;
    uploadScreenshot(id: string, dto: UploadScreenshotDto, user: JwtPayload): Promise<{
        success: boolean;
        data: {
            paymentId: string;
            screenshotUrl: string;
            notes: string | undefined;
            transactionId: string | undefined;
            senderNumber: string | undefined;
        };
        message: string;
    }>;
    getVerificationStatus(id: string, user: JwtPayload): Promise<{
        success: boolean;
        data: {
            paymentId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            gateway: import(".prisma/client").$Enums.PaymentGateway;
            requiresScreenshot: boolean;
            hasScreenshot: boolean;
            screenshotUrl: any;
            screenshotUploadedAt: any;
            isVerified: boolean;
            isPending: boolean;
            isFailed: boolean;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getPayment(id: string, user: JwtPayload): Promise<{
        success: boolean;
        data: {
            booking: {
                field: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    deletedAt: Date | null;
                    description: string | null;
                    address: string;
                    latitude: number | null;
                    longitude: number | null;
                    basePrice: import("@prisma/client/runtime/library").Decimal | null;
                    commissionRate: import("@prisma/client/runtime/library").Decimal | null;
                    ownerId: string;
                    nameAr: string | null;
                    descriptionAr: string | null;
                    addressAr: string | null;
                    averageRating: number | null;
                    totalReviews: number;
                    status: import(".prisma/client").$Enums.FieldStatus;
                };
                player: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string | null;
                    email: string;
                    passwordHash: string | null;
                    role: import(".prisma/client").$Enums.Role;
                    isVerified: boolean;
                    emailVerifiedAt: Date | null;
                    preferredLanguage: string;
                    phoneNumber: string | null;
                    isSuspended: boolean;
                    suspendedUntil: Date | null;
                    noShowCount: number;
                    oauthId: string | null;
                    authProvider: string | null;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                commissionRate: import("@prisma/client/runtime/library").Decimal;
                status: import(".prisma/client").$Enums.BookingStatus;
                fieldId: string;
                bookingNumber: string | null;
                playerId: string;
                timeSlotId: string;
                scheduledDate: Date;
                scheduledStartTime: Date;
                scheduledEndTime: Date;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                depositAmount: import("@prisma/client/runtime/library").Decimal;
                commissionAmount: import("@prisma/client/runtime/library").Decimal;
                ownerRevenue: import("@prisma/client/runtime/library").Decimal;
                cancellationDeadline: Date | null;
                paymentDeadline: Date | null;
                cancelledAt: Date | null;
                cancelledBy: string | null;
                refundAmount: import("@prisma/client/runtime/library").Decimal | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            bookingId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            gateway: import(".prisma/client").$Enums.PaymentGateway;
            transactionId: string | null;
            currency: string;
            gatewayResponse: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    private processWebhookResult;
    private mapGatewayToEnum;
}
