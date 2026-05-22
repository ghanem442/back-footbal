import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RedisModule } from '@modules/redis/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
import { I18nModule } from '@modules/i18n/i18n.module';
import { FieldsModule } from '@modules/fields/fields.module';
import { TimeSlotsModule } from '@modules/time-slots/time-slots.module';
import { AdminModule } from '@modules/admin/admin.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { WalletModule } from '@modules/wallet/wallet.module';
import { QrModule } from '@modules/qr/qr.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { LoggerModule } from '@modules/logger/logger.module';
// import { OtpModule } from '@modules/otp/otp.module';
import { PaymentModule } from '@modules/payments/payment.module';
// import { UsersModule } from '@modules/users/users.module';
// import { JobsModule } from '@modules/jobs/jobs.module';
import { StorageModule } from '@modules/storage/storage.module';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { EmailModule } from '@modules/email/email.module';
import { HealthController } from '@common/health/health.controller';
import { AppConfigModule } from '@config/config.module';
import { ConfigService } from '@nestjs/config';
import { RequestLoggerMiddleware } from '@common/middleware/request-logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    // OtpModule,     
    // UsersModule,   
    I18nModule,
    FieldsModule,
    TimeSlotsModule,
    AdminModule,
    BookingsModule,
    PaymentModule,
    WalletModule,
    QrModule,
    NotificationsModule,
    ReviewsModule,
    // JobsModule,
    StorageModule,
    CloudinaryModule,
    EmailModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
