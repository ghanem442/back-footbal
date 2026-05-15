import { AdminService } from './admin.service';
import { UpdateGlobalCommissionDto, UpdateFieldCommissionDto, UpdateSettingDto, DateRangeQueryDto, ExportReportDto, SuspendUserDto, TopupWalletDto, ListBookingsQueryDto, ListFieldsQueryDto, ListUsersQueryDto, CreateFieldDto, UpdateFieldDto, UpdateFieldStatusDto, UpdateSettingsDto, PlatformWalletWithdrawDto, PendingVerificationQueryDto } from './dto';
import { Response } from 'express';
export declare class AdminController {
    private readonly adminService;
    private readonly logger;
    constructor(adminService: AdminService);
    getGlobalCommissionRate(): Promise<{
        success: boolean;
        data: {
            commissionRate: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateGlobalCommissionRate(updateGlobalCommissionDto: UpdateGlobalCommissionDto): Promise<{
        success: boolean;
        data: {
            commissionRate: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getFieldCommissionRate(fieldId: string): Promise<{
        success: boolean;
        data: {
            fieldId: string;
            commissionRate: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateFieldCommissionRate(fieldId: string, updateFieldCommissionDto: UpdateFieldCommissionDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            commissionRate: number | null;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getAllSettings(): Promise<{
        success: boolean;
        data: {
            settings: {
                key: string;
                value: string;
                dataType: string;
                updatedAt: Date;
            }[];
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getSetting(key: string): Promise<{
        success: boolean;
        data: {
            key: string;
            value: string;
            dataType: string;
            updatedAt: Date;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateSetting(key: string, updateSettingDto: UpdateSettingDto): Promise<{
        success: boolean;
        data: {
            key: string;
            value: string;
            dataType: string;
            updatedAt: Date;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    deleteReview(id: string, userId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getDashboard(): Promise<{
        success: boolean;
        data: {
            activeBookings: number;
            pendingPayments: number;
            totalUsers: number;
            totalFields: number;
            totalBookings: number;
            todayRevenue: number;
            todayCommission: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getRevenueReport(query: DateRangeQueryDto): Promise<{
        success: boolean;
        data: {
            totalCommission: number;
            byGateway: {
                gateway: import(".prisma/client").$Enums.PaymentGateway;
                commission: number;
            }[];
            byField: {
                fieldId: string;
                fieldName: string;
                commission: number;
                bookingCount: number;
            }[];
            byDate: {
                date: string;
                commission: number;
            }[];
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getBookingStatistics(query: DateRangeQueryDto): Promise<{
        success: boolean;
        data: {
            totalBookings: number;
            byStatus: {
                cancelled: number;
                noShows: number;
                completed: number;
                confirmed: number;
                checkedIn: number;
                pendingPayment: number;
                paymentFailed: number;
            };
            completionRate: number;
            byDate: {
                date: string;
                count: number;
            }[];
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getUserStatistics(): Promise<{
        success: boolean;
        data: {
            totalUsers: number;
            byRole: {
                players: number;
                fieldOwners: number;
                admins: number;
            };
            activeUsers: number;
            registrationTrends: {
                month: string;
                count: number;
            }[];
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getFieldStatistics(): Promise<{
        success: boolean;
        data: {
            totalFields: number;
            fields: {
                fieldId: string;
                fieldName: string;
                address: string;
                ownerEmail: string;
                bookingCount: number;
                revenue: number;
                averageRating: number | null;
                totalReviews: number;
            }[];
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    exportReport(exportReportDto: ExportReportDto, res: Response): Promise<void>;
    getUsers(query: ListUsersQueryDto): Promise<{
        success: boolean;
        data: {
            users: {
                id: string;
                createdAt: Date;
                name: string | null;
                email: string;
                role: import(".prisma/client").$Enums.Role;
                isVerified: boolean;
                phoneNumber: string | null;
                isSuspended: boolean;
                suspendedUntil: Date | null;
                noShowCount: number;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    suspendUser(id: string, suspendUserDto: SuspendUserDto): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            suspendedUntil: Date | null;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    topupWallet(topupWalletDto: TopupWalletDto): Promise<{
        success: boolean;
        data: {
            transactionId: string;
            userId: string;
            amount: string;
            previousBalance: string;
            newBalance: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getBookings(query: ListBookingsQueryDto): Promise<{
        success: boolean;
        data: {
            bookings: {
                id: string;
                bookingCode: string;
                player: {
                    id: string;
                    name: string;
                    email: string;
                    phone: string;
                };
                field: {
                    id: string;
                    name: string;
                    address: any;
                };
                owner: {
                    id: string;
                    name: string;
                    email: string;
                };
                date: string;
                startTime: string;
                endTime: string;
                status: import(".prisma/client").$Enums.BookingStatus;
                paymentStatus: string;
                totalPrice: number;
                depositAmount: number;
                remainingAmount: number;
                commissionAmount: number;
                commissionRate: number;
                ownerRevenue: number;
                refundAmount: number;
                cancelledAt: string | null;
                isCheckedIn: boolean;
                checkedInAt: any;
                hasQr: boolean;
                qrToken: any;
                qrUsed: any;
                qrUsedAt: any;
                createdAt: string;
                updatedAt: string;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getFields(query: ListFieldsQueryDto): Promise<{
        success: boolean;
        data: {
            fields: {
                id: string;
                name: string;
                location: string;
                owner: {
                    id: string;
                    name: string;
                    email: string;
                };
                pricePerHour: number | null;
                status: any;
                commissionPercentage: number;
                isCustomCommission: boolean;
                createdAt: string;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    createField(createFieldDto: CreateFieldDto): Promise<{
        success: boolean;
        data: {
            owner: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
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
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateField(fieldId: string, updateFieldDto: UpdateFieldDto): Promise<{
        success: boolean;
        data: {
            owner: {
                id: string;
                name: string | null;
                email: string;
            };
        } & {
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
        message: {
            en: string;
            ar: string;
        };
    }>;
    deleteField(fieldId: string): Promise<{
        success: boolean;
        data: {
            fieldId: string;
            message: string;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateFieldStatus(fieldId: string, updateFieldStatusDto: UpdateFieldStatusDto): Promise<{
        success: boolean;
        data: {
            id: string;
            updatedAt: Date;
            name: string;
            status: import(".prisma/client").$Enums.FieldStatus;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getSystemSettings(): Promise<{
        success: boolean;
        data: {
            globalCommissionPercentage: number;
            depositPercentage: number;
            cancellationRefundWindowHours: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    updateSystemSettings(updateSettingsDto: UpdateSettingsDto): Promise<{
        success: boolean;
        data: {
            globalCommissionPercentage: number;
            depositPercentage: number;
            cancellationRefundWindowHours: number;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getPlatformWallet(): Promise<{
        success: boolean;
        data: {
            id: any;
            balance: number;
            createdAt: any;
            updatedAt: any;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getPlatformWalletSummary(): Promise<{
        success: boolean;
        data: {
            currentBalance: number;
            totalCollected: number;
            totalRefunded: number;
            totalWithdrawn: number;
            totalAdjustments: number;
            netFlow: number;
            totalRefundLiability: number;
            counts: {
                deposits: number;
                refunds: number;
                withdrawals: number;
                adjustments: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getPlatformWalletTransactions(page?: string, limit?: string, type?: string, bookingId?: string): Promise<{
        success: boolean;
        data: {
            transactions: any[];
            pagination: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    platformWalletWithdraw(body: PlatformWalletWithdrawDto): Promise<{
        success: boolean;
        data: {
            id: any;
            type: string;
            amount: number;
            balanceBefore: number;
            balanceAfter: number;
            reference: string | null;
            description: string | null;
            payoutMethod: string | null;
            payoutDetails: Record<string, any> | null;
            createdAt: Date;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getWithdrawalRequests(status?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            requests: {
                owner?: any;
                id: any;
                amount: number;
                status: any;
                paymentMethod: any;
                accountDetails: any;
                payoutId: any;
                rejectionReason: any;
                processedAt: any;
                createdAt: any;
                updatedAt: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    approveWithdrawalRequest(id: string, adminId: string, body: {
        transactionRef?: string;
    }): Promise<{
        success: boolean;
        data: {
            owner?: any;
            id: any;
            amount: number;
            status: any;
            paymentMethod: any;
            accountDetails: any;
            payoutId: any;
            rejectionReason: any;
            processedAt: any;
            createdAt: any;
            updatedAt: any;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    rejectWithdrawalRequest(id: string, adminId: string, body: {
        adminNote: string;
    }): Promise<{
        success: boolean;
        data: {
            owner?: any;
            id: any;
            amount: number;
            status: any;
            paymentMethod: any;
            accountDetails: any;
            payoutId: any;
            rejectionReason: any;
            processedAt: any;
            createdAt: any;
            updatedAt: any;
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getWalletTransactions(page?: string, limit?: string, userId?: string, type?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            transactions: {
                id: string;
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
                type: import(".prisma/client").$Enums.WalletTransactionType;
                amount: number;
                balanceBefore: number;
                balanceAfter: number;
                description: string | null;
                reference: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue;
                createdAt: string;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    getPendingVerificationPayments(query: PendingVerificationQueryDto): Promise<{
        success: boolean;
        data: {
            payments: {
                id: string;
                bookingId: string;
                gateway: import(".prisma/client").$Enums.PaymentGateway;
                amount: number;
                currency: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                transactionId: string | null;
                screenshotUrl: any;
                screenshotUploadedAt: any;
                createdAt: Date;
                updatedAt: Date;
                booking: {
                    id: string;
                    bookingNumber: string | null;
                    scheduledDate: Date;
                    scheduledStartTime: Date;
                    scheduledEndTime: Date;
                    status: import(".prisma/client").$Enums.BookingStatus;
                    player: {
                        id: string;
                        name: string | null;
                        email: string;
                    };
                    field: {
                        id: string;
                        name: string;
                    };
                };
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    approvePayment(paymentId: string, adminId: string, body: {
        adminNotes?: string;
    }): Promise<{
        success: boolean;
        data: {
            payment: {
                id: string;
                status: "COMPLETED";
                bookingId: string;
                gateway?: undefined;
                amount?: undefined;
            };
            booking: {
                id: string;
                status: import(".prisma/client").$Enums.BookingStatus;
                bookingNumber?: undefined;
            };
        } | {
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                bookingId: string;
                gateway: import(".prisma/client").$Enums.PaymentGateway;
                amount: number;
            };
            booking: {
                id: string;
                bookingNumber: string | null;
                status: import(".prisma/client").$Enums.BookingStatus;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
    rejectPayment(paymentId: string, adminId: string, body: {
        reason: string;
    }): Promise<{
        success: boolean;
        data: {
            payment: {
                id: string;
                status: "FAILED";
                bookingId: string;
                gateway?: undefined;
                amount?: undefined;
                rejectionReason?: undefined;
            };
            booking: {
                id: string;
                status: import(".prisma/client").$Enums.BookingStatus;
                bookingNumber?: undefined;
            };
        } | {
            payment: {
                id: string;
                status: import(".prisma/client").$Enums.PaymentStatus;
                bookingId: string;
                gateway: import(".prisma/client").$Enums.PaymentGateway;
                amount: number;
                rejectionReason: string;
            };
            booking: {
                id: string;
                bookingNumber: string | null;
                status: import(".prisma/client").$Enums.BookingStatus;
            };
        };
        message: {
            en: string;
            ar: string;
        };
    }>;
}
