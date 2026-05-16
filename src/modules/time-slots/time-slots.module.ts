import { Module } from '@nestjs/common';
import { TimeSlotsController } from './time-slots.controller';
import { TimeSlotsService } from './time-slots.service';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { I18nModule } from '@modules/i18n/i18n.module';
import { RedisModule } from '@modules/redis/redis.module';

@Module({
  imports: [PrismaModule, I18nModule, RedisModule],
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}
