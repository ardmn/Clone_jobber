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
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ClientsQueryDto } from './dto/clients-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all clients',
    description: 'Get a paginated list of clients with optional search and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Clients retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            firstName: 'John',
            lastName: 'Doe',
            companyName: null,
            email: 'john.doe@example.com',
            phone: '+1-555-123-4567',
            tags: ['VIP'],
            status: 'active',
            clientType: 'residential',
            currency: 'USD',
            paymentTerms: 30,
            creditLimit: null,
            customFields: {},
            internalNotes: null,
            source: null,
            createdBy: '660e8400-e29b-41d4-a716-446655440000',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            deletedAt: null,
            contacts: [],
            addresses: [],
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 50,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser('accountId') accountId: string, @Query() query: ClientsQueryDto) {
    return this.clientsService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description: 'Create a new client with optional contacts and addresses',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        tags: ['VIP'],
        status: 'active',
        clientType: 'residential',
        currency: 'USD',
        paymentTerms: 30,
        creditLimit: null,
        customFields: {},
        internalNotes: 'Prefers morning appointments',
        source: null,
        createdBy: '660e8400-e29b-41d4-a716-446655440000',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        deletedAt: null,
        contacts: [
          {
            id: '770e8400-e29b-41d4-a716-446655440000',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '+1-555-987-6543',
            role: 'Spouse',
            isPrimary: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        addresses: [
          {
            id: '880e8400-e29b-41d4-a716-446655440000',
            addressType: 'service',
            label: 'Home',
            street1: '123 Main Street',
            street2: null,
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
            latitude: null,
            longitude: null,
            isPrimary: true,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(accountId, userId, createClientDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get client by ID',
    description: 'Get a single client by ID with contacts and addresses',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Client retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        tags: ['VIP'],
        status: 'active',
        clientType: 'residential',
        currency: 'USD',
        paymentTerms: 30,
        creditLimit: null,
        customFields: {},
        internalNotes: 'Prefers morning appointments',
        source: null,
        createdBy: '660e8400-e29b-41d4-a716-446655440000',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        deletedAt: null,
        contacts: [],
        addresses: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findById(@Param('id') id: string, @CurrentUser('accountId') accountId: string) {
    return this.clientsService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a client',
    description: 'Update client information',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'John',
        lastName: 'Smith',
        companyName: null,
        email: 'john.smith@example.com',
        phone: '+1-555-123-4567',
        tags: ['VIP', 'Commercial'],
        status: 'active',
        clientType: 'commercial',
        currency: 'USD',
        paymentTerms: 60,
        creditLimit: 25000.00,
        customFields: { accountNumber: 'ACC-12345' },
        internalNotes: 'Updated notes',
        source: null,
        createdBy: '660e8400-e29b-41d4-a716-446655440000',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
        deletedAt: null,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, accountId, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a client',
    description: 'Soft delete a client (can be restored)',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Client deleted successfully',
    schema: {
      example: {
        message: 'Client deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async delete(@Param('id') id: string, @CurrentUser('accountId') accountId: string) {
    return this.clientsService.delete(id, accountId);
  }

  @Post(':id/contacts')
  @ApiOperation({
    summary: 'Add a contact to a client',
    description: 'Add a new contact to an existing client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact added successfully',
    schema: {
      example: {
        id: '770e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-987-6543',
        role: 'Spouse',
        isPrimary: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async addContact(
    @Param('id') clientId: string,
    @CurrentUser('accountId') accountId: string,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.clientsService.addContact(clientId, accountId, createContactDto);
  }

  @Patch(':id/contacts/:contactId')
  @ApiOperation({
    summary: 'Update a contact',
    description: 'Update an existing contact',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'contactId',
    description: 'Contact ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact updated successfully',
    schema: {
      example: {
        id: '770e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-987-6543',
        role: 'Partner',
        isPrimary: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or contact not found' })
  async updateContact(
    @Param('id') clientId: string,
    @Param('contactId') contactId: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.clientsService.updateContact(clientId, contactId, accountId, updateContactDto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a contact',
    description: 'Remove a contact from a client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'contactId',
    description: 'Contact ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact deleted successfully',
    schema: {
      example: {
        message: 'Contact deleted successfully',
        id: '770e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  async deleteContact(
    @Param('id') clientId: string,
    @Param('contactId') contactId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.clientsService.deleteContact(contactId, accountId);
  }

  @Post(':id/addresses')
  @ApiOperation({
    summary: 'Add an address to a client',
    description: 'Add a new address to an existing client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Address added successfully',
    schema: {
      example: {
        id: '880e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        addressType: 'service',
        label: 'Home',
        street1: '123 Main Street',
        street2: null,
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        latitude: null,
        longitude: null,
        isPrimary: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async addAddress(
    @Param('id') clientId: string,
    @CurrentUser('accountId') accountId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.clientsService.addAddress(clientId, accountId, createAddressDto);
  }

  @Patch(':id/addresses/:addressId')
  @ApiOperation({
    summary: 'Update an address',
    description: 'Update an existing address',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'addressId',
    description: 'Address ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    schema: {
      example: {
        id: '880e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        addressType: 'both',
        label: 'Home',
        street1: '123 Main Street',
        street2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        latitude: null,
        longitude: null,
        isPrimary: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or address not found' })
  async updateAddress(
    @Param('id') clientId: string,
    @Param('addressId') addressId: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.clientsService.updateAddress(clientId, addressId, accountId, updateAddressDto);
  }

  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an address',
    description: 'Remove an address from a client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'addressId',
    description: 'Address ID',
    example: '880e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
    schema: {
      example: {
        message: 'Address deleted successfully',
        id: '880e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(
    @Param('id') clientId: string,
    @Param('addressId') addressId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.clientsService.deleteAddress(addressId, accountId);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get client activity history',
    description: 'Get all quotes, jobs, and invoices for a client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Client history retrieved successfully',
    schema: {
      example: {
        client: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          companyName: null,
          email: 'john.doe@example.com',
        },
        quotes: [],
        jobs: [],
        invoices: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getHistory(@Param('id') clientId: string, @CurrentUser('accountId') accountId: string) {
    return this.clientsService.getHistory(clientId, accountId);
  }
}
