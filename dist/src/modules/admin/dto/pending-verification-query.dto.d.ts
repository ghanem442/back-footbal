import { PaymentGateway } from '@prisma/client';
export declare class PendingVerificationQueryDto {
    page?: number;
    limit?: number;
    paymentMethod?: PaymentGateway;
}
