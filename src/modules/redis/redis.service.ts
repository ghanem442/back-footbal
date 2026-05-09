import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { AppConfigService } from '@config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private cacheClient!: RedisClientType;
  private queueClient!: RedisClientType;

  constructor(private configService: AppConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.redisUrl;
    
    console.log('🔵 RedisService - REDIS_URL from configService:', redisUrl);
    console.log('🔵 RedisService - Direct process.env.REDIS_URL:', process.env.REDIS_URL);
    
    let redisConfig: any;
    
    if (redisUrl) {
      console.log('✅ RedisService using REDIS_URL');
      // Use REDIS_URL if provided (Railway, Heroku, etc.)
      redisConfig = { url: redisUrl };
    } else {
      console.log('❌ RedisService falling back to localhost');
      // Fallback to individual config values
      redisConfig = {
        socket: {
          host: this.configService.redisHost,
          port: this.configService.redisPort,
        },
        password: this.configService.redisPassword,
        database: this.configService.redisDb,
      };
    }

    // Cache client
    this.cacheClient = createClient(redisConfig);
    await this.cacheClient.connect();

    // Queue client (separate instance, same DB is fine for testing)
    this.queueClient = createClient(redisConfig);
    await this.queueClient.connect();
  }

  async onModuleDestroy() {
    await this.cacheClient.quit();
    await this.queueClient.quit();
  }

  getCacheClient(): RedisClientType {
    return this.cacheClient;
  }

  getQueueClient(): RedisClientType {
    return this.queueClient;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.cacheClient.ping();
      await this.queueClient.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Redis connection options for BullMQ
   * BullMQ needs connection options object, not URL string
   */
  getConnectionOptions() {
    const redisUrl = this.configService.redisUrl;
    
    if (redisUrl) {
      // Parse Redis URL to connection options
      // Format: redis://[:password@]host:port[/db]
      try {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: url.password || undefined,
          db: parseInt(url.pathname.slice(1)) || 0,
        };
      } catch (error) {
        // Fallback if URL parsing fails
        console.error('Failed to parse REDIS_URL, using defaults:', error);
      }
    }
    
    return {
      host: this.configService.redisHost,
      port: this.configService.redisPort,
      password: this.configService.redisPassword,
      db: this.configService.redisDb,
    };
  }
}
