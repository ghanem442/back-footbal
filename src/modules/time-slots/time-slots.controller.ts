import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimeSlotsService } from './time-slots.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { QueryTimeSlotsDto } from './dto/query-time-slots.dto';
import { BulkCreateTimeSlotsDto } from './dto/bulk-create-time-slots.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { I18nService } from '@modules/i18n/i18n.service';

@ApiTags('Time Slots')
@Controller('time-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TimeSlotsController {
  constructor(
    private readonly timeSlotsService: TimeSlotsService,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @Roles(Role.FIELD_OWNER)
  @HttpCode(HttpStatus.CREATED)
  async createTimeSlot(
    @CurrentUser('userId') userId: string,
    @Body() createTimeSlotDto: CreateTimeSlotDto,
  ) {
    const timeSlot = await this.timeSlotsService.createTimeSlot(
      userId,
      createTimeSlotDto,
    );

    const message = await this.i18n.getBilingualMessage('timeSlot.created');

    return {
      success: true,
      data: timeSlot,
      message,
      // Include the date for proper frontend refresh
      createdDate: createTimeSlotDto.date,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('bulk')
  @Roles(Role.FIELD_OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create time slots',
    description: 'Field owners can create multiple time slots at once for recurring schedules. Skips slots that already exist instead of failing.',
  })
  @ApiBody({ type: BulkCreateTimeSlotsDto })
  @ApiResponse({
    status: 201,
    description: 'Time slots created successfully (some may have been skipped if they already existed)',
    schema: {
      example: {
        success: true,
        data: {
          created: 6,
          skipped: 1,
          skippedDates: ['2026-05-19'],
          dates: 7,
          timeRanges: 1,
        },
        message: {
          en: '6 time slots created successfully, 1 skipped (already exists)',
          ar: 'تم إنشاء 6 فترات زمنية بنجاح، تم تخطي 1 (موجودة بالفعل)',
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid time range or all slots already exist',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only create slots for own fields',
  })
  async bulkCreateTimeSlots(
    @CurrentUser('userId') userId: string,
    @Body() bulkCreateDto: BulkCreateTimeSlotsDto,
  ) {
    const result = await this.timeSlotsService.bulkCreateTimeSlots(
      userId,
      bulkCreateDto,
    );

    // Create a human-readable message based on results
    let message;
    if (result.skipped === 0) {
      // All slots created successfully
      message = {
        en: `${result.created} time slots created successfully`,
        ar: `تم إنشاء ${result.created} فترة زمنية بنجاح`,
      };
    } else {
      // Some slots were skipped
      message = {
        en: `${result.created} time slots created successfully, ${result.skipped} skipped (already exist)`,
        ar: `تم إنشاء ${result.created} فترة زمنية بنجاح، تم تخطي ${result.skipped} (موجودة بالفعل)`,
      };
    }

    return {
      success: true,
      data: result,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query available time slots',
    description: 'Get available time slots with filtering by field and date range.',
  })
  async queryTimeSlots(@Query() queryDto: QueryTimeSlotsDto) {
    const result = await this.timeSlotsService.queryTimeSlots(queryDto);

    const message = await this.i18n.getBilingualMessage(
      'timeSlot.listRetrieved',
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @Roles(Role.FIELD_OWNER)
  @HttpCode(HttpStatus.OK)
  async updateTimeSlot(
    @CurrentUser('userId') userId: string,
    @Param('id') timeSlotId: string,
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
  ) {
    const timeSlot = await this.timeSlotsService.updateTimeSlot(
      timeSlotId,
      userId,
      updateTimeSlotDto,
    );

    const message = await this.i18n.getBilingualMessage('timeSlot.updated');

    return {
      success: true,
      data: timeSlot,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @Roles(Role.FIELD_OWNER)
  @HttpCode(HttpStatus.OK)
  async deleteTimeSlot(
    @CurrentUser('userId') userId: string,
    @Param('id') timeSlotId: string,
  ) {
    await this.timeSlotsService.deleteTimeSlot(timeSlotId, userId);

    const message = await this.i18n.getBilingualMessage('timeSlot.deleted');

    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
