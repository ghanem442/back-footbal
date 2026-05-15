import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformWalletModule } from '@modules/platform-wallet/platform-wallet.module';
import { BookingsModule } from '@modules/bookings/bookings.module';

@Module({
  imports: [PrismaModule, PlatformWalletModule, BookingsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
