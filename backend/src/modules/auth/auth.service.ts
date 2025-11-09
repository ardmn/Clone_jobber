import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    accountId: string;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly PASSWORD_RESET_EXPIRY = 3600000; // 1 hour in milliseconds
  private passwordResetTokens: Map<string, { email: string; expires: number }> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Register a new account with owner user
   * Creates both Account and User entities in a transaction
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, companyName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if account already exists
    const existingAccount = await this.accountRepository.findOne({ where: { email } });
    if (existingAccount) {
      throw new ConflictException('Account with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create account and user in a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create account
      const account = queryRunner.manager.create(Account, {
        name: `${firstName} ${lastName}`,
        companyName,
        email,
        phone: phone || null,
        subscriptionPlan: 'core',
        subscriptionStatus: 'trial',
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      });

      const savedAccount = await queryRunner.manager.save(account);

      // Create owner user
      const user = queryRunner.manager.create(User, {
        accountId: savedAccount.id,
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'owner',
        permissions: ['*'], // Owner has all permissions
        status: 'active',
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      });

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // Generate tokens
      const tokens = await this.generateTokens(savedUser);

      // Update last login
      await this.userRepository.update(savedUser.id, { lastLoginAt: new Date() });

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          accountId: savedUser.accountId,
        },
        tokens,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create account. Please try again.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountId: user.accountId,
      },
      tokens,
    };
  }

  /**
   * Validate user credentials
   * Used by LocalStrategy
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, status: 'active' },
      relations: ['account'],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate JWT access and refresh tokens
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      accountId: user.accountId,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Verify user still exists and is active
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, status: 'active' },
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user (client should discard tokens)
   * In a production app, you might want to blacklist tokens using Redis
   */
  async logout(userId: string): Promise<{ message: string }> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In a real implementation, you would:
    // 1. Add the token to a Redis blacklist
    // 2. Set an expiry time matching the token's expiry
    // 3. Check this blacklist in the JWT strategy

    return {
      message: 'Successfully logged out',
    };
  }

  /**
   * Request password reset
   * Generates a reset token and sends email (mocked for now)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token (simple implementation - use crypto.randomBytes in production)
    const resetToken = this.generateResetToken();
    const expires = Date.now() + this.PASSWORD_RESET_EXPIRY;

    // Store token (in production, use Redis or database)
    this.passwordResetTokens.set(resetToken, { email, expires });

    // TODO: Send email with reset link
    // const resetUrl = `${this.configService.get('PASSWORD_RESET_URL')}?token=${resetToken}`;
    // await this.emailService.sendPasswordResetEmail(email, resetUrl);

    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${this.configService.get('PASSWORD_RESET_URL')}?token=${resetToken}`);

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Verify token exists and is not expired
    const tokenData = this.passwordResetTokens.get(token);

    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (Date.now() > tokenData.expires) {
      this.passwordResetTokens.delete(token);
      throw new BadRequestException('Reset token has expired');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: tokenData.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(user.id, { passwordHash });

    // Delete used token
    this.passwordResetTokens.delete(token);

    return {
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['account'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      account: user.account,
    };
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  private async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate password reset token
   * In production, use crypto.randomBytes(32).toString('hex')
   */
  private generateResetToken(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  }
}
