"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AdminController = AdminController_1 = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
        this.logger = new common_1.Logger(AdminController_1.name);
    }
    async getGlobalCommissionRate() {
        const commissionRate = await this.adminService.getGlobalCommissionRate();
        return {
            success: true,
            data: { commissionRate },
            message: {
                en: 'Global commission rate retrieved successfully',
                ar: 'تم استرجاع معدل العمولة العالمي بنجاح',
            },
        };
    }
    async updateGlobalCommissionRate(updateGlobalCommissionDto) {
        const commissionRate = await this.adminService.updateGlobalCommissionRate(updateGlobalCommissionDto.commissionRate);
        return {
            success: true,
            data: { commissionRate },
            message: {
                en: 'Global commission rate updated successfully',
                ar: 'تم تحديث معدل العمولة العالمي بنجاح',
            },
        };
    }
    async getFieldCommissionRate(fieldId) {
        const commissionRate = await this.adminService.resolveCommissionRate(fieldId);
        return {
            success: true,
            data: { fieldId, commissionRate },
            message: {
                en: 'Field commission rate retrieved successfully',
                ar: 'تم استرجاع معدل عمولة الملعب بنجاح',
            },
        };
    }
    async updateFieldCommissionRate(fieldId, updateFieldCommissionDto) {
        const field = await this.adminService.updateFieldCommissionRate(fieldId, updateFieldCommissionDto.commissionRate);
        return {
            success: true,
            data: field,
            message: {
                en: updateFieldCommissionDto.commissionRate === null
                    ? 'Field commission rate override removed successfully'
                    : 'Field commission rate updated successfully',
                ar: updateFieldCommissionDto.commissionRate === null
                    ? 'تم إزالة تجاوز معدل عمولة الملعب بنجاح'
                    : 'تم تحديث معدل عمولة الملعب بنجاح',
            },
        };
    }
    async getAllSettings() {
        const settings = await this.adminService.getAllSettings();
        return {
            success: true,
            data: { settings },
            message: {
                en: 'Settings retrieved successfully',
                ar: 'تم استرجاع الإعدادات بنجاح',
            },
        };
    }
    async getSetting(key) {
        const setting = await this.adminService.getSetting(key);
        return {
            success: true,
            data: setting,
            message: {
                en: 'Setting retrieved successfully',
                ar: 'تم استرجاع الإعداد بنجاح',
            },
        };
    }
    async updateSetting(key, updateSettingDto) {
        const setting = await this.adminService.updateSetting(key, updateSettingDto.value);
        return {
            success: true,
            data: setting,
            message: {
                en: 'Setting updated successfully',
                ar: 'تم تحديث الإعداد بنجاح',
            },
        };
    }
    async deleteReview(id, userId) {
        const result = await this.adminService.deleteReview(id, userId);
        return {
            success: true,
            data: result,
            message: {
                en: 'Review deleted successfully',
                ar: 'تم حذف المراجعة بنجاح',
            },
        };
    }
    async getDashboard() {
        const metrics = await this.adminService.getDashboardMetrics();
        return {
            success: true,
            data: metrics,
            message: {
                en: 'Dashboard metrics retrieved successfully',
                ar: 'تم استرجاع مقاييس لوحة التحكم بنجاح',
            },
        };
    }
    async getRevenueReport(query) {
        const report = await this.adminService.getRevenueReport(query.startDate, query.endDate, query.groupBy);
        return {
            success: true,
            data: report,
            message: {
                en: 'Revenue report retrieved successfully',
                ar: 'تم استرجاع تقرير الإيرادات بنجاح',
            },
        };
    }
    async getBookingStatistics(query) {
        const statistics = await this.adminService.getBookingStatistics(query.startDate, query.endDate);
        return {
            success: true,
            data: statistics,
            message: {
                en: 'Booking statistics retrieved successfully',
                ar: 'تم استرجاع إحصائيات الحجوزات بنجاح',
            },
        };
    }
    async getUserStatistics() {
        const statistics = await this.adminService.getUserStatistics();
        return {
            success: true,
            data: statistics,
            message: {
                en: 'User statistics retrieved successfully',
                ar: 'تم استرجاع إحصائيات المستخدمين بنجاح',
            },
        };
    }
    async getFieldStatistics() {
        const statistics = await this.adminService.getFieldStatistics();
        return {
            success: true,
            data: statistics,
            message: {
                en: 'Field statistics retrieved successfully',
                ar: 'تم استرجاع إحصائيات الملاعب بنجاح',
            },
        };
    }
    async exportReport(exportReportDto, res) {
        const csvData = await this.adminService.exportReport(exportReportDto.reportType, exportReportDto.startDate, exportReportDto.endDate);
        const filename = `${exportReportDto.reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvData);
    }
    async getUsers(query) {
        const result = await this.adminService.getUsersWithFilters(query);
        return {
            success: true,
            data: result,
            message: {
                en: 'Users retrieved successfully',
                ar: 'تم استرجاع المستخدمين بنجاح',
            },
        };
    }
    async suspendUser(id, suspendUserDto) {
        const user = await this.adminService.suspendUser(id, suspendUserDto.suspendedUntil ?? null);
        return {
            success: true,
            data: user,
            message: {
                en: suspendUserDto.suspendedUntil
                    ? 'User suspended successfully'
                    : 'User unsuspended successfully',
                ar: suspendUserDto.suspendedUntil
                    ? 'تم تعليق المستخدم بنجاح'
                    : 'تم إلغاء تعليق المستخدم بنجاح',
            },
        };
    }
    async topupWallet(topupWalletDto) {
        const result = await this.adminService.topupUserWallet(topupWalletDto.userId, topupWalletDto.amount, topupWalletDto.description);
        return {
            success: true,
            data: result,
            message: {
                en: 'Wallet topped up successfully',
                ar: 'تم شحن المحفظة بنجاح',
            },
        };
    }
    async getBookings(query) {
        const result = await this.adminService.getBookings(query);
        return {
            success: true,
            data: result,
            message: {
                en: 'Bookings retrieved successfully',
                ar: 'تم استرجاع الحجوزات بنجاح',
            },
        };
    }
    async getFields(query) {
        const result = await this.adminService.getFields(query);
        return {
            success: true,
            data: result,
            message: {
                en: 'Fields retrieved successfully',
                ar: 'تم استرجاع الملاعب بنجاح',
            },
        };
    }
    async createField(createFieldDto) {
        const field = await this.adminService.createField(createFieldDto);
        return {
            success: true,
            data: field,
            message: {
                en: 'Field created successfully',
                ar: 'تم إنشاء الملعب بنجاح',
            },
        };
    }
    async updateField(fieldId, updateFieldDto) {
        const field = await this.adminService.updateField(fieldId, updateFieldDto);
        return {
            success: true,
            data: field,
            message: {
                en: 'Field updated successfully',
                ar: 'تم تحديث الملعب بنجاح',
            },
        };
    }
    async deleteField(fieldId) {
        const result = await this.adminService.deleteField(fieldId);
        return {
            success: true,
            data: result,
            message: {
                en: 'Field deleted successfully',
                ar: 'تم حذف الملعب بنجاح',
            },
        };
    }
    async updateFieldStatus(fieldId, updateFieldStatusDto) {
        const result = await this.adminService.updateFieldStatus(fieldId, updateFieldStatusDto.status);
        return {
            success: true,
            data: result,
            message: {
                en: 'Field status updated successfully',
                ar: 'تم تحديث حالة الملعب بنجاح',
            },
        };
    }
    async getSystemSettings() {
        const settings = await this.adminService.getSettings();
        return {
            success: true,
            data: settings,
            message: {
                en: 'System settings retrieved successfully',
                ar: 'تم استرجاع إعدادات النظام بنجاح',
            },
        };
    }
    async updateSystemSettings(updateSettingsDto) {
        const settings = await this.adminService.updateSettings(updateSettingsDto);
        return {
            success: true,
            data: settings,
            message: {
                en: 'System settings updated successfully',
                ar: 'تم تحديث إعدادات النظام بنجاح',
            },
        };
    }
    async getPlatformWallet() {
        const wallet = await this.adminService.getPlatformWallet();
        return { success: true, data: wallet, message: { en: 'Platform wallet retrieved', ar: 'تم استرجاع محفظة المنصة' } };
    }
    async getPlatformWalletSummary() {
        const summary = await this.adminService.getPlatformWalletSummary();
        return { success: true, data: summary, message: { en: 'Platform wallet summary retrieved', ar: 'تم استرجاع ملخص محفظة المنصة' } };
    }
    async getPlatformWalletTransactions(page, limit, type, bookingId) {
        const result = await this.adminService.getPlatformWalletTransactions(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, type, bookingId);
        return { success: true, data: result, message: { en: 'Platform transactions retrieved', ar: 'تم استرجاع معاملات المنصة' } };
    }
    async platformWalletWithdraw(body) {
        const { amount, description, reference, payoutMethod, accountHolderName } = body;
        let payoutDetails;
        if (payoutMethod === dto_1.PayoutMethod.MOBILE_WALLET) {
            payoutDetails = {
                phoneNumber: body.phoneNumber,
                walletProvider: body.walletProvider,
                accountHolderName,
            };
        }
        else {
            payoutDetails = {
                accountDetails: body.accountDetails,
                accountHolderName,
            };
        }
        const result = await this.adminService.platformWalletWithdraw(amount, payoutMethod, payoutDetails, description, reference);
        return {
            success: true,
            data: result,
            message: { en: 'Platform withdrawal processed', ar: 'تم سحب المبلغ من محفظة المنصة' },
        };
    }
    async getWithdrawalRequests(status, page, limit) {
        const result = await this.adminService.getWithdrawalRequests(status, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 10);
        return {
            success: true,
            data: result,
            message: { en: 'Withdrawal requests retrieved', ar: 'تم استرجاع طلبات السحب' },
        };
    }
    async approveWithdrawalRequest(id, adminId, body) {
        const result = await this.adminService.approveWithdrawalRequest(id, adminId, body.transactionRef);
        return {
            success: true,
            data: result,
            message: { en: 'Withdrawal request approved', ar: 'تمت الموافقة على طلب السحب' },
        };
    }
    async rejectWithdrawalRequest(id, adminId, body) {
        const result = await this.adminService.rejectWithdrawalRequest(id, adminId, body.adminNote);
        return {
            success: true,
            data: result,
            message: { en: 'Withdrawal request rejected', ar: 'تم رفض طلب السحب' },
        };
    }
    async getWalletTransactions(page, limit, userId, type, startDate, endDate) {
        const result = await this.adminService.getWalletTransactions({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            userId,
            type,
            startDate,
            endDate,
        });
        return {
            success: true,
            data: result,
            message: {
                en: 'Wallet transactions retrieved successfully',
                ar: 'تم استرجاع معاملات المحفظة بنجاح',
            },
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('commission/global'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGlobalCommissionRate", null);
__decorate([
    (0, common_1.Patch)('commission/global'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.UpdateGlobalCommissionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateGlobalCommissionRate", null);
__decorate([
    (0, common_1.Get)('fields/:fieldId/commission'),
    __param(0, (0, common_1.Param)('fieldId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFieldCommissionRate", null);
__decorate([
    (0, common_1.Patch)('fields/:fieldId/commission'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('fieldId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFieldCommissionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateFieldCommissionRate", null);
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllSettings", null);
__decorate([
    (0, common_1.Get)('settings/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSetting", null);
__decorate([
    (0, common_1.Patch)('settings/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSettingDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSetting", null);
__decorate([
    (0, common_1.Delete)('reviews/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get dashboard metrics',
        description: 'Retrieve real-time dashboard metrics including active bookings, revenue, and system statistics. Admin only.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard metrics retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    totalRevenue: '50000.00',
                    totalBookings: 1250,
                    activeBookings: 45,
                    totalUsers: 500,
                    totalFields: 75,
                },
                message: {
                    en: 'Dashboard metrics retrieved successfully',
                    ar: 'تم استرجاع مقاييس لوحة التحكم بنجاح',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Admin access required',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('reports/revenue'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DateRangeQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueReport", null);
__decorate([
    (0, common_1.Get)('reports/bookings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DateRangeQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookingStatistics", null);
__decorate([
    (0, common_1.Get)('reports/users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserStatistics", null);
__decorate([
    (0, common_1.Get)('reports/fields'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFieldStatistics", null);
__decorate([
    (0, common_1.Post)('reports/export'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ExportReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all users with filters',
        description: 'Retrieve paginated list of users with optional filters for email, role, verification status, and suspension status',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'email', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, enum: client_1.Role }),
    (0, swagger_1.ApiQuery)({ name: 'isVerified', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'isSuspended', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SuspendUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Post)('wallet/topup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Topup user wallet (Admin only)',
        description: 'Manually add balance to any user wallet. For testing and administrative purposes.',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.TopupWalletDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Wallet topped up successfully',
        schema: {
            example: {
                success: true,
                data: {
                    transactionId: 'tx-uuid',
                    userId: 'user-uuid',
                    amount: '1000.00',
                    previousBalance: '500.00',
                    newBalance: '1500.00',
                },
                message: {
                    en: 'Wallet topped up successfully',
                    ar: 'تم شحن المحفظة بنجاح',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TopupWalletDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "topupWallet", null);
__decorate([
    (0, common_1.Get)('bookings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all bookings with filters',
        description: 'Retrieve paginated list of bookings with filters for status, field, owner, date range, and search',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'PAYMENT_FAILED'] }),
    (0, swagger_1.ApiQuery)({ name: 'fieldId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by booking ID, player email, or phone' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListBookingsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Get)('fields'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all fields with filters',
        description: 'Retrieve paginated list of fields with filters for search, status, and owner',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search by field name or address' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListFieldsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFields", null);
__decorate([
    (0, common_1.Post)('fields'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new field',
        description: 'Admin can create a new field for any field owner',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.CreateFieldDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateFieldDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createField", null);
__decorate([
    (0, common_1.Patch)('fields/:fieldId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update a field',
        description: 'Admin can update any field details',
    }),
    (0, swagger_1.ApiParam)({ name: 'fieldId', type: String }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdateFieldDto }),
    __param(0, (0, common_1.Param)('fieldId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFieldDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateField", null);
__decorate([
    (0, common_1.Delete)('fields/:fieldId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete a field',
        description: 'Admin can soft delete a field (cannot have active bookings)',
    }),
    (0, swagger_1.ApiParam)({ name: 'fieldId', type: String }),
    __param(0, (0, common_1.Param)('fieldId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteField", null);
__decorate([
    (0, common_1.Patch)('fields/:fieldId/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update field status',
        description: 'Update field status (ACTIVE, INACTIVE, HIDDEN, DISABLED, PENDING_APPROVAL, REJECTED)',
    }),
    (0, swagger_1.ApiParam)({ name: 'fieldId', type: String }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdateFieldStatusDto }),
    __param(0, (0, common_1.Param)('fieldId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFieldStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateFieldStatus", null);
__decorate([
    (0, common_1.Get)('system-settings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get system settings',
        description: 'Retrieve all system settings including commission, deposit, and cancellation policies',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemSettings", null);
__decorate([
    (0, common_1.Patch)('system-settings'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Update system settings',
        description: 'Update system-wide settings for commission, deposit, and cancellation policies',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdateSettingsDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.UpdateSettingsDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSystemSettings", null);
__decorate([
    (0, common_1.Get)('platform-wallet'),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform wallet balance' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformWallet", null);
__decorate([
    (0, common_1.Get)('platform-wallet/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform wallet financial summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformWalletSummary", null);
__decorate([
    (0, common_1.Get)('platform-wallet/transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform wallet transactions' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'bookingId', required: false, type: String }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformWalletTransactions", null);
__decorate([
    (0, common_1.Post)('platform-wallet/withdraw'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw from platform wallet (Admin only)' }),
    (0, swagger_1.ApiBody)({
        schema: {
            oneOf: [
                {
                    title: 'Mobile Wallet',
                    example: {
                        amount: 100,
                        description: 'Platform withdrawal',
                        reference: 'PLATFORM-W-001',
                        payoutMethod: 'MOBILE_WALLET',
                        phoneNumber: '01012345678',
                        walletProvider: 'VODAFONE',
                        accountHolderName: 'Admin Name',
                    },
                },
                {
                    title: 'InstaPay',
                    example: {
                        amount: 100,
                        description: 'Platform withdrawal',
                        reference: 'PLATFORM-W-002',
                        payoutMethod: 'INSTAPAY',
                        accountDetails: 'name@instapay',
                        accountHolderName: 'Admin Name',
                    },
                },
            ],
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PlatformWalletWithdrawDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "platformWalletWithdraw", null);
__decorate([
    (0, common_1.Get)('withdrawal-requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all withdrawal requests' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawalRequests", null);
__decorate([
    (0, common_1.Post)('withdrawal-requests/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a withdrawal request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveWithdrawalRequest", null);
__decorate([
    (0, common_1.Post)('withdrawal-requests/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a withdrawal request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectWithdrawalRequest", null);
__decorate([
    (0, common_1.Get)('wallet/transactions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get wallet transactions history',
        description: 'Retrieve paginated list of all wallet transactions with filters',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWalletTransactions", null);
exports.AdminController = AdminController = AdminController_1 = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map