import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users in account',
    description: 'Retrieve a paginated list of users in the current account with optional filters for search, role, and status.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
    example: 'john',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['owner', 'admin', 'manager', 'dispatcher', 'worker', 'limited_worker'],
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            accountId: '660e8400-e29b-41d4-a716-446655440000',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            avatarUrl: null,
            role: 'owner',
            permissions: ['*'],
            status: 'active',
            lastLoginAt: '2024-01-15T10:30:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        meta: {
          total: 15,
          page: 1,
          limit: 10,
          totalPages: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async findAll(
    @Query() query: UsersQueryDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create team member',
    description: 'Add a new team member to the account. The password will be hashed before storage.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
        avatarUrl: null,
        role: 'worker',
        permissions: [],
        status: 'active',
        lastLoginAt: null,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this email already exists',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.create(accountId, createUserDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user details',
    description: 'Retrieve detailed information about a specific user. Users can only access users in their own account.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatarUrl: null,
        role: 'owner',
        permissions: ['*'],
        status: 'active',
        lastLoginAt: '2024-01-15T10:30:00.000Z',
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
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
    status: 404,
    description: 'User not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information such as name, phone, and avatar. Users can only update users in their own account.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatarUrl: 'https://example.com/avatars/john.jpg',
        role: 'owner',
        permissions: ['*'],
        status: 'active',
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
    status: 404,
    description: 'User not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.update(id, accountId, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove team member',
    description: 'Soft delete a user (sets deletedAt timestamp). Users can only delete users in their own account. Cannot delete the last active owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot delete the last active owner',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    await this.usersService.delete(id, accountId);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Change a user\'s role. Cannot change the role of the last active owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatarUrl: null,
        role: 'admin',
        permissions: [],
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot change role of last active owner',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.updateRole(id, accountId, updateRoleDto.role);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user status',
    description: 'Activate or deactivate a user account. Cannot deactivate the last active owner.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '660e8400-e29b-41d4-a716-446655440000',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        avatarUrl: null,
        role: 'worker',
        permissions: [],
        status: 'inactive',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot deactivate last active owner',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser('accountId') accountId: string,
  ) {
    return await this.usersService.updateStatus(id, accountId, updateStatusDto.status);
  }
}
