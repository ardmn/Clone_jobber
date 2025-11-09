import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../database/entities/account.entity';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Find account by ID with validation
   * @param id Account ID
   * @param userAccountId User's account ID for multi-tenant validation
   */
  async findById(id: string, userAccountId: string): Promise<Account> {
    // Ensure user can only access their own account
    if (id !== userAccountId) {
      throw new ForbiddenException('You can only access your own account');
    }

    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  /**
   * Update account details
   * @param id Account ID
   * @param userAccountId User's account ID for multi-tenant validation
   * @param updateAccountDto Update data
   */
  async update(
    id: string,
    userAccountId: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    // Ensure user can only update their own account
    if (id !== userAccountId) {
      throw new ForbiddenException('You can only update your own account');
    }

    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if email is being changed and if it's already in use
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingAccount = await this.accountRepository.findOne({
        where: { email: updateAccountDto.email },
      });

      if (existingAccount) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    // Update account fields
    Object.assign(account, updateAccountDto);

    return await this.accountRepository.save(account);
  }

  /**
   * Update account settings
   * @param id Account ID
   * @param userAccountId User's account ID for multi-tenant validation
   * @param updateSettingsDto Settings update data
   */
  async updateSettings(
    id: string,
    userAccountId: string,
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<Account> {
    // Ensure user can only update their own account
    if (id !== userAccountId) {
      throw new ForbiddenException('You can only update your own account settings');
    }

    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Update settings
    if (updateSettingsDto.timezone !== undefined) {
      account.timezone = updateSettingsDto.timezone;
    }
    if (updateSettingsDto.currency !== undefined) {
      account.currency = updateSettingsDto.currency;
    }
    if (updateSettingsDto.dateFormat !== undefined) {
      account.dateFormat = updateSettingsDto.dateFormat;
    }

    return await this.accountRepository.save(account);
  }

  /**
   * Soft delete account
   * @param id Account ID
   * @param userAccountId User's account ID for multi-tenant validation
   */
  async delete(id: string, userAccountId: string): Promise<void> {
    // Ensure user can only delete their own account
    if (id !== userAccountId) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const account = await this.accountRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Soft delete (set deletedAt timestamp)
    await this.accountRepository.softDelete(id);
  }

  /**
   * Get account settings
   * @param id Account ID
   * @param userAccountId User's account ID for multi-tenant validation
   */
  async getSettings(id: string, userAccountId: string): Promise<{
    timezone: string;
    currency: string;
    dateFormat: string;
  }> {
    const account = await this.findById(id, userAccountId);

    return {
      timezone: account.timezone,
      currency: account.currency,
      dateFormat: account.dateFormat,
    };
  }
}
