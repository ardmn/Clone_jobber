import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get account details',
    description: 'Retrieve detailed information about a specific account. Users can only access their own account.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        companyName: 'Acme Services Inc.',
        email: 'john@example.com',
        phone: '+1234567890',
        subscriptionPlan: 'core',
        subscriptionStatus: 'active',
        subscriptionStartDate: '2024-01-01T00:00:00.000Z',
        subscriptionEndDate: '2025-01-01T00:00:00.000Z',
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only access their own account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.accountsService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update account details',
    description: 'Update account information such as name, company name, email, and phone. Users can only update their own account.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        companyName: 'Acme Services Inc.',
        email: 'john@example.com',
        phone: '+1234567890',
        subscriptionPlan: 'core',
        subscriptionStatus: 'active',
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only update their own account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already in use by another account',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.accountsService.update(id, accountId, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete account',
    description: 'Soft delete an account (sets deletedAt timestamp). Users can only delete their own account. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Account deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only delete their own account',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    await this.accountsService.delete(id, accountId);
  }

  @Get(':id/settings')
  @ApiOperation({
    summary: 'Get account settings',
    description: 'Retrieve account settings including timezone, currency, and date format preferences.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account settings retrieved successfully',
    schema: {
      example: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only access their own account settings',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getSettings(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.accountsService.getSettings(id, accountId);
  }

  @Patch(':id/settings')
  @ApiOperation({
    summary: 'Update account settings',
    description: 'Update account settings such as timezone, currency, and date format.',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account settings updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        companyName: 'Acme Services Inc.',
        email: 'john@example.com',
        phone: '+1234567890',
        subscriptionPlan: 'core',
        subscriptionStatus: 'active',
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User can only update their own account settings',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async updateSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.accountsService.updateSettings(id, accountId, updateSettingsDto);
  }
}
