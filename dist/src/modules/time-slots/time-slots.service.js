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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const i18n_service_1 = require("../i18n/i18n.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
let TimeSlotsService = class TimeSlotsService {
    constructor(prisma, i18n, redisService) {
        this.prisma = prisma;
        this.i18n = i18n;
        this.redisService = redisService;
    }
    async createTimeSlot(userId, dto) {
        const idempotencyKey = `timeslot:${userId}:${dto.fieldId}:${dto.date}:${dto.startTime}:${dto.endTime}:${dto.price}`;
        const redis = this.redisService.getCacheClient();
        const existing = await redis.get(idempotencyKey);
        if (existing) {
            console.log(`[Idempotency] Returning cached result for key: ${idempotencyKey}`);
            return JSON.parse(existing);
        }
        console.log(`[TimeSlot] Creating new time slot: ${dto.date} ${dto.startTime}-${dto.endTime} for field ${dto.fieldId}`);
        const field = await this.prisma.field.findUnique({
            where: { id: dto.fieldId },
        });
        if (!field) {
            throw new common_1.NotFoundException(await this.i18n.translate('field.notFound'));
        }
        if (field.ownerId !== userId) {
            throw new common_1.ForbiddenException(await this.i18n.translate('field.notOwner'));
        }
        if (field.deletedAt) {
            throw new common_1.BadRequestException(await this.i18n.translate('field.notFound'));
        }
        const [year, month, day] = dto.date.split('-').map(Number);
        const slotDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
        if (slotDate < todayUTC) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.pastDate'));
        }
        const [startH, startM] = dto.startTime.split(':').map(Number);
        const [endH, endM] = dto.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        if (endMinutes <= startMinutes) {
            throw new common_1.BadRequestException({
                code: 'INVALID_TIME_RANGE',
                message: {
                    en: 'End time must be after start time',
                    ar: 'يجب أن يكون وقت الانتهاء بعد وقت البدء',
                },
                startTime: dto.startTime,
                endTime: dto.endTime,
            });
        }
        const startTime = this.parseTime(dto.startTime);
        const endTime = this.parseTime(dto.endTime);
        if (startTime >= endTime) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.startTimeBeforeEndTime'));
        }
        if (dto.price <= 0) {
            throw new common_1.BadRequestException('Price must be greater than zero');
        }
        const overlappingSlots = await this.prisma.timeSlot.findMany({
            where: {
                fieldId: dto.fieldId,
                date: slotDate,
                OR: [
                    {
                        AND: [
                            { startTime: { lte: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
                            { endTime: { gt: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lt: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
                            { endTime: { gte: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { gte: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
                            { endTime: { lte: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
                        ],
                    },
                ],
            },
        });
        if (overlappingSlots.length > 0) {
            throw new common_1.BadRequestException({
                code: 'SLOT_ALREADY_EXISTS',
                message: {
                    en: 'This time slot already exists',
                    ar: 'هذه الفترة الزمنية موجودة بالفعل',
                },
                date: dto.date,
                startTime: dto.startTime,
                endTime: dto.endTime,
                hint: {
                    en: 'The slot is already available. Please refresh the list.',
                    ar: 'الفترة متاحة بالفعل. يرجى تحديث القائمة.',
                },
            });
        }
        let timeSlot;
        try {
            timeSlot = await this.prisma.timeSlot.create({
                data: {
                    fieldId: dto.fieldId,
                    date: slotDate,
                    startTime: new Date(`1970-01-01T${dto.startTime}:00.000Z`),
                    endTime: new Date(`1970-01-01T${dto.endTime}:00.000Z`),
                    price: dto.price,
                    status: client_1.SlotStatus.AVAILABLE,
                },
                include: {
                    field: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                },
            });
            const verifySlot = await this.prisma.timeSlot.findUnique({
                where: { id: timeSlot.id },
            });
            if (!verifySlot) {
                console.error(`[TimeSlot] CRITICAL: Slot ${timeSlot.id} was created but not found in DB!`);
                throw new Error('Time slot creation failed - database verification failed');
            }
            console.log(`[TimeSlot] ✅ Slot ${timeSlot.id} created and verified in database`);
            console.log(`[TimeSlot] Date saved: ${verifySlot.date.toISOString()} (should be ${dto.date})`);
        }
        catch (error) {
            console.error(`[TimeSlot] ❌ Database error during slot creation:`, error);
            if (error?.code === 'P2002') {
                throw new common_1.BadRequestException('A time slot with these exact details already exists');
            }
            throw error;
        }
        const formattedTimeSlot = {
            ...timeSlot,
            startTime: timeSlot.startTime.toISOString().substring(11, 16),
            endTime: timeSlot.endTime.toISOString().substring(11, 16),
        };
        try {
            await redis.set(idempotencyKey, JSON.stringify(formattedTimeSlot), { EX: 3 });
            console.log(`[Idempotency] ✅ Cached result for key: ${idempotencyKey} (TTL: 3s)`);
        }
        catch (cacheError) {
            console.error(`[Idempotency] ⚠️  Failed to cache result:`, cacheError);
        }
        return formattedTimeSlot;
    }
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    async queryTimeSlots(dto) {
        const { fieldId, startDate, endDate, page = 1, limit = 10 } = dto;
        const where = {
            status: client_1.SlotStatus.AVAILABLE,
        };
        if (fieldId) {
            where.fieldId = fieldId;
        }
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                const [year, month, day] = startDate.split('-').map(Number);
                where.date.gte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            }
            if (endDate) {
                const [year, month, day] = endDate.split('-').map(Number);
                where.date.lte = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            }
        }
        const now = new Date();
        const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        const hours = now.getUTCHours().toString().padStart(2, '0');
        const minutes = now.getUTCMinutes().toString().padStart(2, '0');
        const currentTime = new Date(`1970-01-01T${hours}:${minutes}:00.000Z`);
        where.AND = [
            {
                OR: [
                    { date: { gt: currentDate } },
                    {
                        AND: [
                            { date: currentDate },
                            { startTime: { gt: currentTime } },
                        ],
                    },
                ],
            },
        ];
        const skip = (page - 1) * limit;
        const [timeSlots, total] = await Promise.all([
            this.prisma.timeSlot.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { date: 'asc' },
                    { startTime: 'asc' },
                ],
                include: {
                    field: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                            averageRating: true,
                        },
                    },
                },
            }),
            this.prisma.timeSlot.count({ where }),
        ]);
        const formattedTimeSlots = timeSlots.map(slot => ({
            ...slot,
            startTime: slot.startTime.toISOString().substring(11, 16),
            endTime: slot.endTime.toISOString().substring(11, 16),
        }));
        return {
            data: formattedTimeSlots,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateTimeSlot(timeSlotId, userId, dto) {
        const timeSlot = await this.prisma.timeSlot.findUnique({
            where: { id: timeSlotId },
            include: {
                field: true,
                bookings: true,
            },
        });
        if (!timeSlot) {
            throw new common_1.NotFoundException(await this.i18n.translate('timeSlot.notFound'));
        }
        if (timeSlot.field.ownerId !== userId) {
            throw new common_1.ForbiddenException(await this.i18n.translate('field.notOwner'));
        }
        if (timeSlot.field.deletedAt) {
            throw new common_1.BadRequestException(await this.i18n.translate('field.notFound'));
        }
        if (timeSlot.status === client_1.SlotStatus.BOOKED) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.cannotModifyBooked'));
        }
        const newStartTime = dto.startTime || this.formatTime(timeSlot.startTime);
        const newEndTime = dto.endTime || this.formatTime(timeSlot.endTime);
        if (this.parseTime(newStartTime) >= this.parseTime(newEndTime)) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.startTimeBeforeEndTime'));
        }
        if (dto.date || dto.startTime || dto.endTime) {
            let newDate;
            if (dto.date) {
                const [year, month, day] = dto.date.split('-').map(Number);
                newDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            }
            else {
                newDate = timeSlot.date;
            }
            if (dto.date) {
                const today = new Date();
                const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
                if (newDate < todayUTC) {
                    throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.pastDate'));
                }
            }
            const overlappingSlots = await this.prisma.timeSlot.findMany({
                where: {
                    id: { not: timeSlotId },
                    fieldId: timeSlot.fieldId,
                    date: newDate,
                    OR: [
                        {
                            AND: [
                                { startTime: { lte: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
                                { endTime: { gt: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
                            ],
                        },
                        {
                            AND: [
                                { startTime: { lt: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
                                { endTime: { gte: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
                            ],
                        },
                        {
                            AND: [
                                { startTime: { gte: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
                                { endTime: { lte: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
                            ],
                        },
                    ],
                },
            });
            if (overlappingSlots.length > 0) {
                throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.overlappingSlot'));
            }
        }
        const updateData = {};
        if (dto.date) {
            const [year, month, day] = dto.date.split('-').map(Number);
            updateData.date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        }
        if (dto.startTime) {
            updateData.startTime = new Date(`1970-01-01T${dto.startTime}:00.000Z`);
        }
        if (dto.endTime) {
            updateData.endTime = new Date(`1970-01-01T${dto.endTime}:00.000Z`);
        }
        if (dto.price !== undefined) {
            if (dto.price <= 0) {
                throw new common_1.BadRequestException('Price must be greater than zero');
            }
            updateData.price = dto.price;
        }
        const updatedTimeSlot = await this.prisma.timeSlot.update({
            where: { id: timeSlotId },
            data: updateData,
            include: {
                field: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
        return {
            ...updatedTimeSlot,
            startTime: updatedTimeSlot.startTime.toISOString().substring(11, 16),
            endTime: updatedTimeSlot.endTime.toISOString().substring(11, 16),
        };
    }
    async deleteTimeSlot(timeSlotId, userId) {
        const timeSlot = await this.prisma.timeSlot.findUnique({
            where: { id: timeSlotId },
            include: {
                field: true,
                bookings: true,
            },
        });
        if (!timeSlot) {
            throw new common_1.NotFoundException(await this.i18n.translate('timeSlot.notFound'));
        }
        if (timeSlot.field.ownerId !== userId) {
            throw new common_1.ForbiddenException(await this.i18n.translate('field.notOwner'));
        }
        if (timeSlot.field.deletedAt) {
            throw new common_1.BadRequestException(await this.i18n.translate('field.notFound'));
        }
        if (timeSlot.status === client_1.SlotStatus.BOOKED) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.cannotModifyBooked'));
        }
        const slotDate = new Date(timeSlot.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        slotDate.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.cannotDeletePastSlot'));
        }
        await this.prisma.timeSlot.delete({
            where: { id: timeSlotId },
        });
    }
    formatTime(date) {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    async bulkCreateTimeSlots(userId, dto) {
        const field = await this.prisma.field.findUnique({
            where: { id: dto.fieldId },
        });
        if (!field) {
            throw new common_1.NotFoundException(await this.i18n.translate('field.notFound'));
        }
        if (field.ownerId !== userId) {
            throw new common_1.ForbiddenException(await this.i18n.translate('field.notOwner'));
        }
        if (field.deletedAt) {
            throw new common_1.BadRequestException(await this.i18n.translate('field.notFound'));
        }
        const [startYear, startMonth, startDay] = dto.startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = dto.endDate.split('-').map(Number);
        const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0));
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
        if (startDate < todayUTC) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.pastDate'));
        }
        if (startDate > endDate) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.invalidDateRange'));
        }
        const invalidDays = dto.daysOfWeek.filter(day => day < 0 || day > 6);
        if (invalidDays.length > 0) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.invalidDaysOfWeek'));
        }
        for (const timeRange of dto.timeRanges) {
            const startTime = this.parseTime(timeRange.startTime);
            const endTime = this.parseTime(timeRange.endTime);
            if (startTime >= endTime) {
                throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.startTimeBeforeEndTime'));
            }
            if (timeRange.price <= 0) {
                throw new common_1.BadRequestException('Price must be greater than zero');
            }
        }
        const datesToGenerate = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (dto.daysOfWeek.includes(dayOfWeek)) {
                datesToGenerate.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        if (datesToGenerate.length === 0) {
            throw new common_1.BadRequestException(await this.i18n.translate('timeSlot.noDatesGenerated'));
        }
        const slotsToCreate = [];
        for (const date of datesToGenerate) {
            for (const timeRange of dto.timeRanges) {
                slotsToCreate.push({
                    fieldId: dto.fieldId,
                    date: date,
                    startTime: new Date(`1970-01-01T${timeRange.startTime}:00.000Z`),
                    endTime: new Date(`1970-01-01T${timeRange.endTime}:00.000Z`),
                    price: timeRange.price,
                    status: client_1.SlotStatus.AVAILABLE,
                });
            }
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const slotsToActuallyCreate = [];
            const skippedSlots = [];
            for (const slot of slotsToCreate) {
                const overlappingSlots = await tx.timeSlot.findMany({
                    where: {
                        fieldId: slot.fieldId,
                        date: slot.date,
                        OR: [
                            {
                                AND: [
                                    { startTime: { lte: slot.startTime } },
                                    { endTime: { gt: slot.startTime } },
                                ],
                            },
                            {
                                AND: [
                                    { startTime: { lt: slot.endTime } },
                                    { endTime: { gte: slot.endTime } },
                                ],
                            },
                            {
                                AND: [
                                    { startTime: { gte: slot.startTime } },
                                    { endTime: { lte: slot.endTime } },
                                ],
                            },
                        ],
                    },
                });
                if (overlappingSlots.length > 0) {
                    const dateStr = slot.date.toISOString().split('T')[0];
                    const startTimeStr = this.formatTime(slot.startTime);
                    const endTimeStr = this.formatTime(slot.endTime);
                    skippedSlots.push({
                        date: dateStr,
                        startTime: startTimeStr,
                        endTime: endTimeStr,
                        reason: 'Already exists',
                    });
                    console.log(`[BulkTimeSlot] ⏭️  Skipping existing slot: ${dateStr} ${startTimeStr}-${endTimeStr}`);
                }
                else {
                    slotsToActuallyCreate.push(slot);
                }
            }
            if (slotsToActuallyCreate.length === 0 && skippedSlots.length > 0) {
                throw new common_1.BadRequestException({
                    code: 'ALL_SLOTS_EXIST',
                    message: {
                        en: 'All time slots in this range already exist',
                        ar: 'جميع الفترات الزمنية في هذا النطاق موجودة بالفعل',
                    },
                    skipped: skippedSlots.length,
                    skippedSlots: skippedSlots,
                    hint: {
                        en: 'Please refresh the list to see existing slots',
                        ar: 'يرجى تحديث القائمة لرؤية الفترات الموجودة',
                    },
                });
            }
            if (slotsToActuallyCreate.length === 0) {
                throw new common_1.BadRequestException({
                    code: 'NO_SLOTS_TO_CREATE',
                    message: {
                        en: 'No valid time slots to create',
                        ar: 'لا توجد فترات زمنية صالحة للإنشاء',
                    },
                });
            }
            const createdSlots = await tx.timeSlot.createMany({
                data: slotsToActuallyCreate,
            });
            console.log(`[BulkTimeSlot] ✅ Created ${createdSlots.count} slots in database`);
            if (skippedSlots.length > 0) {
                console.log(`[BulkTimeSlot] ⏭️  Skipped ${skippedSlots.length} existing slots`);
            }
            if (createdSlots.count === 0) {
                console.error(`[BulkTimeSlot] ❌ CRITICAL: createMany returned count=0 but no error thrown`);
                throw new Error('Bulk time slot creation failed - no slots were created');
            }
            if (slotsToActuallyCreate.length > 0) {
                const firstSlot = slotsToActuallyCreate[0];
                const verifyCount = await tx.timeSlot.count({
                    where: {
                        fieldId: firstSlot.fieldId,
                        date: firstSlot.date,
                        startTime: firstSlot.startTime,
                        endTime: firstSlot.endTime,
                    },
                });
                if (verifyCount === 0) {
                    console.error(`[BulkTimeSlot] ❌ CRITICAL: Verification failed - first slot not found in DB`);
                    throw new Error('Bulk time slot creation failed - database verification failed');
                }
                console.log(`[BulkTimeSlot] ✅ Verified slots exist in database`);
            }
            return { createdSlots, skippedSlots };
        });
        console.log(`[BulkTimeSlot] ✅ Transaction committed - ${result.createdSlots.count} created, ${result.skippedSlots.length} skipped`);
        const skippedDates = [...new Set(result.skippedSlots.map(s => s.date))];
        return {
            created: result.createdSlots.count,
            skipped: result.skippedSlots.length,
            skippedDates: skippedDates,
            skippedSlots: result.skippedSlots,
            dates: datesToGenerate.length,
            timeRanges: dto.timeRanges.length,
        };
    }
};
exports.TimeSlotsService = TimeSlotsService;
exports.TimeSlotsService = TimeSlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        i18n_service_1.I18nService,
        redis_service_1.RedisService])
], TimeSlotsService);
//# sourceMappingURL=time-slots.service.js.map