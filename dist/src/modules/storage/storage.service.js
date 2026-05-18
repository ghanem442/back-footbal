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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_storage_provider_1 = require("./providers/cloudinary-storage.provider");
let StorageService = StorageService_1 = class StorageService {
    constructor(configService, cloudinaryProvider) {
        this.configService = configService;
        this.cloudinaryProvider = cloudinaryProvider;
        this.logger = new common_1.Logger(StorageService_1.name);
        const providerType = this.configService.get('STORAGE_PROVIDER', 'cloudinary').toLowerCase();
        if (providerType !== 'cloudinary') {
            this.logger.warn(`Storage provider "${providerType}" is not supported. Using Cloudinary only.`);
        }
        this.provider = this.cloudinaryProvider;
        this.logger.log('Using Cloudinary Storage Provider (only supported provider)');
    }
    async upload(file, filename, mimeType) {
        return this.provider.upload(file, filename, mimeType);
    }
    async delete(url) {
        return this.provider.delete(url);
    }
    async getSignedUrl(url, expiresIn) {
        return this.provider.getSignedUrl(url, expiresIn);
    }
    generateCloudinarySignature(params) {
        if (!(this.provider instanceof cloudinary_storage_provider_1.CloudinaryStorageProvider)) {
            throw new Error('Signature generation is only available with Cloudinary storage provider');
        }
        return this.provider.generateSignature(params);
    }
    getCloudinaryUploadConfig() {
        if (!(this.provider instanceof cloudinary_storage_provider_1.CloudinaryStorageProvider)) {
            throw new Error('Cloudinary config is only available with Cloudinary storage provider');
        }
        return this.provider.getUploadConfig();
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        cloudinary_storage_provider_1.CloudinaryStorageProvider])
], StorageService);
//# sourceMappingURL=storage.service.js.map