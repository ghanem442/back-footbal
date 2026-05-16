"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const storage_service_1 = require("./storage.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const path = __importStar(require("path"));
let StorageController = class StorageController {
    constructor(storageService, configService, prismaService) {
        this.storageService = storageService;
        this.configService = configService;
        this.prismaService = prismaService;
    }
    async getCloudinarySignature() {
        try {
            const timestamp = Math.round(Date.now() / 1000);
            const folder = 'payment-proofs';
            const signature = this.storageService.generateCloudinarySignature({
                timestamp,
                folder,
            });
            const config = this.storageService.getCloudinaryUploadConfig();
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(errorMessage);
        }
    }
    async uploadPaymentProof(file, paymentId) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (!paymentId) {
            throw new common_1.BadRequestException('paymentId is required');
        }
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size must not exceed 5MB');
        }
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `payment-proof/${paymentId}-${timestamp}${ext}`;
        const url = await this.storageService.upload(file.buffer, filename, file.mimetype);
        return {
            success: true,
            data: {
                url,
                screenshotUrl: url,
                paymentId,
                filename: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
            },
            message: {
                en: 'Payment proof uploaded successfully',
                ar: 'تم رفع إثبات الدفع بنجاح',
            },
        };
    }
    async confirmPaymentProofUrl(body) {
        if (!body.url) {
            throw new common_1.BadRequestException('URL is required');
        }
        if (!body.paymentId) {
            throw new common_1.BadRequestException('paymentId is required');
        }
        if (!body.url.includes('cloudinary.com')) {
            throw new common_1.BadRequestException('Invalid image URL. Must be a Cloudinary URL.');
        }
        try {
            const payment = await this.prismaService.payment.findUnique({
                where: { id: body.paymentId },
            });
            if (!payment) {
                throw new common_1.BadRequestException('Payment not found');
            }
            await this.prismaService.payment.update({
                where: { id: body.paymentId },
                data: {
                    gatewayResponse: {
                        ...payment.gatewayResponse,
                        screenshotUrl: body.url,
                        screenshotUploadedAt: new Date().toISOString(),
                    },
                },
            });
            return {
                success: true,
                data: {
                    url: body.url,
                    paymentId: body.paymentId,
                },
                message: {
                    en: 'Payment proof URL confirmed successfully',
                    ar: 'تم تأكيد رابط إثبات الدفع بنجاح',
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new common_1.BadRequestException(`Failed to update payment: ${errorMessage}`);
        }
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, common_1.Get)('cloudinary/signature'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Cloudinary upload signature',
        description: 'Get signature and configuration for direct client-side uploads to Cloudinary',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getCloudinarySignature", null);
__decorate([
    (0, common_1.Post)('payment-proof'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload payment proof screenshot (Legacy)',
        description: 'Upload a payment screenshot for manual verification (InstaPay, etc.). Consider using client-side upload with /cloudinary/signature instead.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'paymentId'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Payment screenshot image file',
                },
                paymentId: {
                    type: 'string',
                    description: 'Payment ID',
                    example: 'uuid-here',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('paymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "uploadPaymentProof", null);
__decorate([
    (0, common_1.Post)('payment-proof/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirm payment proof URL',
        description: 'Confirm and save the Cloudinary URL after client-side upload',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['url', 'paymentId'],
            properties: {
                url: {
                    type: 'string',
                    description: 'Cloudinary URL of the uploaded image',
                    example: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/payment-proofs/abc123.jpg',
                },
                paymentId: {
                    type: 'string',
                    description: 'Payment ID',
                    example: 'uuid-here',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "confirmPaymentProofUrl", null);
exports.StorageController = StorageController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, common_1.Controller)('uploads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [storage_service_1.StorageService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map