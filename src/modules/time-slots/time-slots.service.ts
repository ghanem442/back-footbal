import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { I18nService } from '@modules/i18n/i18n.service';
import { RedisService } from '@modules/redis/redis.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { QueryTimeSlotsDto } from './dto/query-time-slots.dto';
import { BulkCreateTimeSlotsDto } from './dto/bulk-create-time-slots.dto';
import { SlotStatus } from '@prisma/client';

@Injectable()
export class TimeSlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Create a new time slot for a field
   * Validates:
   * - Field exists and is owned by the user
   * - Start time is before end time
   * - No overlapping slots on the same field and date
   * 
   * Implements Redis-based idempotency to prevent duplicate requests within 3 seconds
   */
  async createTimeSlot(userId: string, dto: CreateTimeSlotDto) {
    // Create a unique idempotency key for this exact request
    const idempotencyKey = `timeslot:${userId}:${dto.fieldId}:${dto.date}:${dto.startTime}:${dto.endTime}:${dto.price}`;
    
    // Check if same request was made in last 3 seconds (reduced from 10)
    const redis = this.redisService.getCacheClient();
    const existing = await redis.get(idempotencyKey);
    
    if (existing) {
      // Return the previous result instead of creating duplicate
      console.log(`[Idempotency] Returning cached result for key: ${idempotencyKey}`);
      return JSON.parse(existing);
    }

    console.log(`[TimeSlot] Creating new time slot: ${dto.date} ${dto.startTime}-${dto.endTime} for field ${dto.fieldId}`);

    // Validate field ownership
    const field = await this.prisma.field.findUnique({
      where: { id: dto.fieldId },
    });

    if (!field) {
      throw new NotFoundException(
        await this.i18n.translate('field.notFound'),
      );
    }

    if (field.ownerId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('field.notOwner'),
      );
    }

    if (field.deletedAt) {
      throw new BadRequestException(
        await this.i18n.translate('field.notFound'),
      );
    }

    // FIX BUG 2: Parse date string directly without timezone conversion
    // Input format: "YYYY-MM-DD" (e.g., "2026-05-18")
    // We need to store it as-is without timezone shifts
    const [year, month, day] = dto.date.split('-').map(Number);
    const slotDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    // Validate date is not in the past
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

    if (slotDate < todayUTC) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.pastDate'),
      );
    }

    // Validate start time < end time
    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      throw new BadRequestException({
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
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.startTimeBeforeEndTime'),
      );
    }

    // Validate price is positive
    if (dto.price <= 0) {
      throw new BadRequestException(
        'Price must be greater than zero',
      );
    }

    // Check for overlapping slots
    const overlappingSlots = await this.prisma.timeSlot.findMany({
      where: {
        fieldId: dto.fieldId,
        date: slotDate,
        OR: [
          {
            // New slot starts during existing slot
            AND: [
              { startTime: { lte: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
              { endTime: { gt: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
            ],
          },
          {
            // New slot ends during existing slot
            AND: [
              { startTime: { lt: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
              { endTime: { gte: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
            ],
          },
          {
            // New slot completely contains existing slot
            AND: [
              { startTime: { gte: new Date(`1970-01-01T${dto.startTime}:00.000Z`) } },
              { endTime: { lte: new Date(`1970-01-01T${dto.endTime}:00.000Z`) } },
            ],
          },
        ],
      },
    });

    if (overlappingSlots.length > 0) {
      // Return a clear, app-friendly error message
      throw new BadRequestException({
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

    // FIX BUG 1: Create the time slot and verify it was saved BEFORE caching
    let timeSlot;
    try {
      timeSlot = await this.prisma.timeSlot.create({
        data: {
          fieldId: dto.fieldId,
          date: slotDate,
          startTime: new Date(`1970-01-01T${dto.startTime}:00.000Z`),
          endTime: new Date(`1970-01-01T${dto.endTime}:00.000Z`),
          price: dto.price,
          status: SlotStatus.AVAILABLE,
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

      // Verify the slot was actually saved to the database
      const verifySlot = await this.prisma.timeSlot.findUnique({
        where: { id: timeSlot.id },
      });

      if (!verifySlot) {
        console.error(`[TimeSlot] CRITICAL: Slot ${timeSlot.id} was created but not found in DB!`);
        throw new Error('Time slot creation failed - database verification failed');
      }

      console.log(`[TimeSlot] ✅ Slot ${timeSlot.id} created and verified in database`);
      console.log(`[TimeSlot] Date saved: ${verifySlot.date.toISOString()} (should be ${dto.date})`);
    } catch (error: any) {
      console.error(`[TimeSlot] ❌ Database error during slot creation:`, error);
      
      // Check for unique constraint violations (Prisma error code)
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'A time slot with these exact details already exists',
        );
      }
      
      // Re-throw the error - do NOT cache failed attempts
      throw error;
    }

    // Format times as plain strings to avoid timezone issues
    const formattedTimeSlot = {
      ...timeSlot,
      startTime: timeSlot.startTime.toISOString().substring(11, 16), // "09:00"
      endTime: timeSlot.endTime.toISOString().substring(11, 16),     // "10:00"
    };

    // FIX BUG 1: Only cache AFTER successful database insert and verification
    try {
      await redis.set(idempotencyKey, JSON.stringify(formattedTimeSlot), { EX: 3 });
      console.log(`[Idempotency] ✅ Cached result for key: ${idempotencyKey} (TTL: 3s)`);
    } catch (cacheError) {
      // Log cache errors but don't fail the request - slot was created successfully
      console.error(`[Idempotency] ⚠️  Failed to cache result:`, cacheError);
    }

    return formattedTimeSlot;
  }

  /**
   * Parse time string to minutes for comparison
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Query available time slots with filtering and pagination
   * Returns only AVAILABLE slots with future datetime
   * Supports filtering by fieldId and date range
   */
  async queryTimeSlots(dto: QueryTimeSlotsDto) {
    const { fieldId, startDate, endDate, page = 1, limit = 10 } = dto;

    // Build where clause
    const where: any = {
      status: SlotStatus.AVAILABLE,
    };

    // Filter by fieldId if provided
    if (fieldId) {
      where.fieldId = fieldId;
    }

    // Filter by date range if provided (FIX BUG 2: proper date parsing)
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

    // Calculate current datetime for future filtering
    const now = new Date();
    const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const hours = now.getUTCHours().toString().padStart(2, '0');
    const minutes = now.getUTCMinutes().toString().padStart(2, '0');
    const currentTime = new Date(`1970-01-01T${hours}:${minutes}:00.000Z`);

    // Filter for future datetime: date > today OR (date = today AND startTime > now)
    // Use AND to avoid overriding existing where conditions (fieldId, date range)
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

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
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

    // Format times as plain strings to avoid timezone issues
    const formattedTimeSlots = timeSlots.map(slot => ({
      ...slot,
      startTime: slot.startTime.toISOString().substring(11, 16), // "09:00"
      endTime: slot.endTime.toISOString().substring(11, 16),     // "10:00"
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

  /**
   * Update a time slot
   * Validates:
   * - Time slot exists
   * - Field is owned by the user
   * - Time slot is not booked (status = AVAILABLE)
   * - Start time is before end time (if times are being updated)
   * - No overlapping slots (if date/time is being updated)
   */
  async updateTimeSlot(
    timeSlotId: string,
    userId: string,
    dto: Partial<{
      date: string;
      startTime: string;
      endTime: string;
      price: number;
    }>,
  ) {
    // Find the time slot with field information
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        field: true,
        bookings: true,
      },
    });

    if (!timeSlot) {
      throw new NotFoundException(
        await this.i18n.translate('timeSlot.notFound'),
      );
    }

    // Validate field ownership
    if (timeSlot.field.ownerId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('field.notOwner'),
      );
    }

    // Check if field is deleted
    if (timeSlot.field.deletedAt) {
      throw new BadRequestException(
        await this.i18n.translate('field.notFound'),
      );
    }

    // Prevent modification of booked slots
    if (timeSlot.status === SlotStatus.BOOKED) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.cannotModifyBooked'),
      );
    }

    // Validate start time < end time if times are being updated
    const newStartTime = dto.startTime || this.formatTime(timeSlot.startTime);
    const newEndTime = dto.endTime || this.formatTime(timeSlot.endTime);

    if (this.parseTime(newStartTime) >= this.parseTime(newEndTime)) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.startTimeBeforeEndTime'),
      );
    }

    // Check for overlapping slots if date or time is being updated
    if (dto.date || dto.startTime || dto.endTime) {
      // FIX BUG 2: Parse date string directly without timezone conversion
      let newDate;
      if (dto.date) {
        const [year, month, day] = dto.date.split('-').map(Number);
        newDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        newDate = timeSlot.date;
      }

      // Validate date is not in the past if being updated
      if (dto.date) {
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

        if (newDate < todayUTC) {
          throw new BadRequestException(
            await this.i18n.translate('timeSlot.pastDate'),
          );
        }
      }

      const overlappingSlots = await this.prisma.timeSlot.findMany({
        where: {
          id: { not: timeSlotId }, // Exclude current slot
          fieldId: timeSlot.fieldId,
          date: newDate,
          OR: [
            {
              // New slot starts during existing slot
              AND: [
                { startTime: { lte: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
                { endTime: { gt: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
              ],
            },
            {
              // New slot ends during existing slot
              AND: [
                { startTime: { lt: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
                { endTime: { gte: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
              ],
            },
            {
              // New slot completely contains existing slot
              AND: [
                { startTime: { gte: new Date(`1970-01-01T${newStartTime}:00.000Z`) } },
                { endTime: { lte: new Date(`1970-01-01T${newEndTime}:00.000Z`) } },
              ],
            },
          ],
        },
      });

      if (overlappingSlots.length > 0) {
        throw new BadRequestException(
          await this.i18n.translate('timeSlot.overlappingSlot'),
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (dto.date) {
      // FIX BUG 2: Parse date string directly without timezone conversion
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
      // Validate price is positive
      if (dto.price <= 0) {
        throw new BadRequestException(
          'Price must be greater than zero',
        );
      }
      updateData.price = dto.price;
    }

    // Update the time slot
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

    // Format times as plain strings to avoid timezone issues
    return {
      ...updatedTimeSlot,
      startTime: updatedTimeSlot.startTime.toISOString().substring(11, 16), // "09:00"
      endTime: updatedTimeSlot.endTime.toISOString().substring(11, 16),     // "10:00"
    };
  }

  /**
   * Delete a time slot
   * Validates:
   * - Time slot exists
   * - Field is owned by the user
   * - Time slot is not booked (status = AVAILABLE)
   */
  async deleteTimeSlot(timeSlotId: string, userId: string) {
    // Find the time slot with field information
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        field: true,
        bookings: true,
      },
    });

    if (!timeSlot) {
      throw new NotFoundException(
        await this.i18n.translate('timeSlot.notFound'),
      );
    }

    // Validate field ownership
    if (timeSlot.field.ownerId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('field.notOwner'),
      );
    }

    // Check if field is deleted
    if (timeSlot.field.deletedAt) {
      throw new BadRequestException(
        await this.i18n.translate('field.notFound'),
      );
    }

    // Prevent deletion of booked slots
    if (timeSlot.status === SlotStatus.BOOKED) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.cannotModifyBooked'),
      );
    }

    // Prevent deletion of past time slots
    const slotDate = new Date(timeSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate < today) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.cannotDeletePastSlot'),
      );
    }

    // Delete the time slot
    await this.prisma.timeSlot.delete({
      where: { id: timeSlotId },
    });
  }

  /**
   * Format a Date object to HH:MM string (UTC)
   */
  private formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Bulk generate time slots for recurring schedules
   * Validates:
   * - Field exists and is owned by the user
   * - Start date is before or equal to end date
   * - Days of week are valid (0-6)
   * - Time ranges are valid (start < end)
   * - No overlapping slots
   * Uses database transaction for atomicity
   */
  async bulkCreateTimeSlots(userId: string, dto: BulkCreateTimeSlotsDto) {
    // Validate field ownership
    const field = await this.prisma.field.findUnique({
      where: { id: dto.fieldId },
    });

    if (!field) {
      throw new NotFoundException(
        await this.i18n.translate('field.notFound'),
      );
    }

    if (field.ownerId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('field.notOwner'),
      );
    }

    if (field.deletedAt) {
      throw new BadRequestException(
        await this.i18n.translate('field.notFound'),
      );
    }

    // Validate date range (FIX BUG 2: proper date parsing)
    const [startYear, startMonth, startDay] = dto.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = dto.endDate.split('-').map(Number);
    
    const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 0, 0, 0, 0));
    
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

    if (startDate < todayUTC) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.pastDate'),
      );
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.invalidDateRange'),
      );
    }

    // Validate days of week (0-6)
    const invalidDays = dto.daysOfWeek.filter(day => day < 0 || day > 6);
    if (invalidDays.length > 0) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.invalidDaysOfWeek'),
      );
    }

    // Validate time ranges
    for (const timeRange of dto.timeRanges) {
      const startTime = this.parseTime(timeRange.startTime);
      const endTime = this.parseTime(timeRange.endTime);

      if (startTime >= endTime) {
        throw new BadRequestException(
          await this.i18n.translate('timeSlot.startTimeBeforeEndTime'),
        );
      }

      // Validate price is positive
      if (timeRange.price <= 0) {
        throw new BadRequestException(
          'Price must be greater than zero',
        );
      }
    }

    // Generate all dates that match the days of week
    const datesToGenerate: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dto.daysOfWeek.includes(dayOfWeek)) {
        datesToGenerate.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (datesToGenerate.length === 0) {
      throw new BadRequestException(
        await this.i18n.translate('timeSlot.noDatesGenerated'),
      );
    }

    // Generate time slots for each date and time range
    const slotsToCreate: Array<{
      fieldId: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      price: number;
      status: SlotStatus;
    }> = [];

    for (const date of datesToGenerate) {
      for (const timeRange of dto.timeRanges) {
        slotsToCreate.push({
          fieldId: dto.fieldId,
          date: date,
          startTime: new Date(`1970-01-01T${timeRange.startTime}:00.000Z`),
          endTime: new Date(`1970-01-01T${timeRange.endTime}:00.000Z`),
          price: timeRange.price,
          status: SlotStatus.AVAILABLE,
        });
      }
    }

    // Check for overlapping slots in a transaction - skip existing instead of failing
    const result = await this.prisma.$transaction(async (tx) => {
      const slotsToActuallyCreate: typeof slotsToCreate = [];
      const skippedSlots: Array<{ date: string; startTime: string; endTime: string; reason: string }> = [];

      // Check each slot for overlaps
      for (const slot of slotsToCreate) {
        const overlappingSlots = await tx.timeSlot.findMany({
          where: {
            fieldId: slot.fieldId,
            date: slot.date,
            OR: [
              {
                // New slot starts during existing slot
                AND: [
                  { startTime: { lte: slot.startTime } },
                  { endTime: { gt: slot.startTime } },
                ],
              },
              {
                // New slot ends during existing slot
                AND: [
                  { startTime: { lt: slot.endTime } },
                  { endTime: { gte: slot.endTime } },
                ],
              },
              {
                // New slot completely contains existing slot
                AND: [
                  { startTime: { gte: slot.startTime } },
                  { endTime: { lte: slot.endTime } },
                ],
              },
            ],
          },
        });

        if (overlappingSlots.length > 0) {
          // Skip this slot instead of failing
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
        } else {
          // No overlap, safe to create
          slotsToActuallyCreate.push(slot);
        }
      }

      // If ALL slots were skipped, return error
      if (slotsToActuallyCreate.length === 0 && skippedSlots.length > 0) {
        throw new BadRequestException({
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

      // If no slots to create at all (shouldn't happen but safety check)
      if (slotsToActuallyCreate.length === 0) {
        throw new BadRequestException({
          code: 'NO_SLOTS_TO_CREATE',
          message: {
            en: 'No valid time slots to create',
            ar: 'لا توجد فترات زمنية صالحة للإنشاء',
          },
        });
      }

      // Create only the non-overlapping slots
      const createdSlots = await tx.timeSlot.createMany({
        data: slotsToActuallyCreate,
      });

      console.log(`[BulkTimeSlot] ✅ Created ${createdSlots.count} slots in database`);
      if (skippedSlots.length > 0) {
        console.log(`[BulkTimeSlot] ⏭️  Skipped ${skippedSlots.length} existing slots`);
      }

      // Verify at least one slot was created
      if (createdSlots.count === 0) {
        console.error(`[BulkTimeSlot] ❌ CRITICAL: createMany returned count=0 but no error thrown`);
        throw new Error('Bulk time slot creation failed - no slots were created');
      }

      // Sample verification: check if first slot exists
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

    // Extract unique dates that were skipped
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
}
