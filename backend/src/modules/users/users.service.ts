import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find all users in an account with pagination and filters
   * @param accountId Account ID to filter users
   * @param query Query parameters for pagination and filtering
   */
  async findAll(accountId: string, query: UsersQueryDto) {
    const { page = 1, limit = 10, search, role, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { accountId };

    // Add role filter if provided
    if (role) {
      where.role = role;
    }

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Build query
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.accountId = :accountId', { accountId });

    // Add role filter
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Add status filter
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Add search filter (search in firstName, lastName, email)
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new team member
   * @param accountId Account ID to associate user with
   * @param createUserDto User creation data
   */
  async create(accountId: string, createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists in this account
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email, accountId },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists in your account');
    }

    // Check if email exists in any account (for global uniqueness)
    const globalExistingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (globalExistingUser) {
      throw new ConflictException('This email is already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // Create new user
    const user = this.userRepository.create({
      accountId,
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      role: createUserDto.role,
      status: 'active',
    });

    return await this.userRepository.save(user);
  }

  /**
   * Find user by ID with account scoping
   * @param id User ID
   * @param accountId Account ID for multi-tenant validation
   */
  async findById(id: string, accountId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, accountId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user details
   * @param id User ID
   * @param accountId Account ID for multi-tenant validation
   * @param updateUserDto Update data
   */
  async update(
    id: string,
    accountId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findById(id, accountId);

    // Update user fields
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  /**
   * Update user role
   * @param id User ID
   * @param accountId Account ID for multi-tenant validation
   * @param role New role
   */
  async updateRole(id: string, accountId: string, role: string): Promise<User> {
    const user = await this.findById(id, accountId);

    // Prevent changing the role of the last owner
    if (user.role === 'owner' && role !== 'owner') {
      const ownerCount = await this.userRepository.count({
        where: { accountId, role: 'owner', status: 'active' },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change role of the last active owner. Assign another owner first.',
        );
      }
    }

    user.role = role;
    return await this.userRepository.save(user);
  }

  /**
   * Update user status (activate/deactivate)
   * @param id User ID
   * @param accountId Account ID for multi-tenant validation
   * @param status New status
   */
  async updateStatus(id: string, accountId: string, status: string): Promise<User> {
    const user = await this.findById(id, accountId);

    // Prevent deactivating the last active owner
    if (user.role === 'owner' && status === 'inactive') {
      const activeOwnerCount = await this.userRepository.count({
        where: { accountId, role: 'owner', status: 'active' },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the last active owner. Assign another owner first.',
        );
      }
    }

    user.status = status;
    return await this.userRepository.save(user);
  }

  /**
   * Soft delete user (remove team member)
   * @param id User ID
   * @param accountId Account ID for multi-tenant validation
   */
  async delete(id: string, accountId: string): Promise<void> {
    const user = await this.findById(id, accountId);

    // Prevent deleting the last active owner
    if (user.role === 'owner') {
      const activeOwnerCount = await this.userRepository.count({
        where: { accountId, role: 'owner', status: 'active' },
      });

      if (activeOwnerCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last active owner. Assign another owner first.',
        );
      }
    }

    // Soft delete
    await this.userRepository.softDelete(id);
  }
}
