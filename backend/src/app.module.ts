import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { TimeTrackingModule } from './modules/time-tracking/time-tracking.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { FilesModule } from './modules/files/files.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC') === 'true',
        logging: configService.get('DB_LOGGING') === 'true',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL') || 60000,
        limit: configService.get('THROTTLE_LIMIT') || 1000,
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    AccountsModule,
    UsersModule,
    ClientsModule,
    QuotesModule,
    JobsModule,
    InvoicesModule,
    PaymentsModule,
    ScheduleModule,
    TimeTrackingModule,
    CommunicationsModule,
    FilesModule,
    ReportsModule,
    AuditLogsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
