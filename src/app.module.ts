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
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from '@common/throttler/redis-throttler-storage.service';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from '@common/guards/throttler-behind-proxy.guard';
import { RequestLoggerMiddleware } from '@common/middleware/request-logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get('NODE_ENV') === 'development';
        
        // Check if REDIS_URL is provided (Railway, Heroku, etc.)
        const redisUrl = configService.get('redis.url') || configService.get('REDIS_URL');
        
        console.log('🔴 REDIS_URL from config:', redisUrl);
        console.log('🔴 All env REDIS vars:', {
          REDIS_URL: process.env.REDIS_URL,
          REDIS_HOST: process.env.REDIS_HOST,
          REDISHOST: process.env.REDISHOST,
        });
        
        let redis: Redis;
        if (redisUrl) {
          console.log('✅ Using REDIS_URL:', redisUrl);
          // Use REDIS_URL if provided
          redis = new Redis(redisUrl);
        } else {
          console.log('❌ Falling back to localhost Redis');
          // Fallback to individual config values
          redis = new Redis({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            db: configService.get('REDIS_THROTTLE_DB', 1),
          });
        }

        return {
          throttlers: [
            {
              name: 'default',
              ttl: isDev ? 60000 : 60000, // 1 minute window for all requests
              limit: isDev ? 100 : 100, // 100 requests per minute
            },
            {
              name: 'login',
              ttl: 60000, // 1 minute window for login
              limit: 5, // 5 login attempts per minute
            },
          ],
          storage: new RedisThrottlerStorageService(redis) as ThrottlerStorage,
          skipIf: () => isDev, // Skip throttling completely in dev
        };
      },
    }),
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
