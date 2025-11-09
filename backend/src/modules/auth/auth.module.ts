import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';

@Module({
  imports: [
    // Import User and Account entities for repository injection
    TypeOrmModule.forFeature([User, Account]),

    // Configure Passport with default strategy
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // Configure JWT module with async configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
