import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, In } from 'typeorm';
import { Client } from '../../database/entities/client.entity';
import { ClientContact } from '../../database/entities/client-contact.entity';
import { ClientAddress } from '../../database/entities/client-address.entity';
import { Quote } from '../../database/entities/quote.entity';
import { Job } from '../../database/entities/job.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ClientsQueryDto } from './dto/clients-query.dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientContact)
    private contactRepository: Repository<ClientContact>,
    @InjectRepository(ClientAddress)
    private addressRepository: Repository<ClientAddress>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private dataSource: DataSource,
  ) {}

  async findAll(accountId: string, query: ClientsQueryDto) {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      tags,
      clientType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.accountId = :accountId', { accountId });

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.companyName ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply status filter
    if (status) {
      queryBuilder.andWhere('client.status = :status', { status });
    }

    // Apply clientType filter
    if (clientType) {
      queryBuilder.andWhere('client.clientType = :clientType', { clientType });
    }

    // Apply tags filter - PostgreSQL array contains
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('client.tags && ARRAY[:...tags]::varchar[]', { tags });
    }

    // Apply sorting
    const sortColumn = `client.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get results with relations
    const clients = await queryBuilder
      .leftJoinAndSelect('client.contacts', 'contacts')
      .leftJoinAndSelect('client.addresses', 'addresses')
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(accountId: string, userId: string, createClientDto: CreateClientDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Extract contacts and addresses from DTO
      const { contacts, addresses, ...clientData } = createClientDto;

      // Create client entity
      const client = this.clientRepository.create({
        ...clientData,
        accountId,
        createdBy: userId,
        status: 'active',
      });

      // Save client
      const savedClient = await queryRunner.manager.save(Client, client);

      // Handle contacts if provided
      if (contacts && contacts.length > 0) {
        await this.handlePrimaryContact(contacts, savedClient.id, queryRunner);
      }

      // Handle addresses if provided
      if (addresses && addresses.length > 0) {
        await this.handlePrimaryAddress(addresses, savedClient.id, queryRunner);
      }

      await queryRunner.commitTransaction();

      // Return client with relations
      return this.findById(savedClient.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create client: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string, accountId: string) {
    const client = await this.clientRepository.findOne({
      where: { id, accountId },
      relations: ['contacts', 'addresses'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, accountId: string, updateClientDto: UpdateClientDto) {
    const client = await this.findById(id, accountId);

    // Update client fields
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client);
  }

  async delete(id: string, accountId: string) {
    const client = await this.findById(id, accountId);

    // Soft delete the client
    await this.clientRepository.softDelete(id);

    return {
      message: 'Client deleted successfully',
      id,
    };
  }

  async addContact(clientId: string, accountId: string, createContactDto: CreateContactDto) {
    const client = await this.findById(clientId, accountId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If this contact is being set as primary, unset any existing primary contact
      if (createContactDto.isPrimary) {
        await queryRunner.manager.update(
          ClientContact,
          { clientId, isPrimary: true },
          { isPrimary: false },
        );
      }

      const contact = this.contactRepository.create({
        ...createContactDto,
        clientId,
      });

      const savedContact = await queryRunner.manager.save(ClientContact, contact);

      await queryRunner.commitTransaction();

      return savedContact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to add contact: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateContact(
    clientId: string,
    contactId: string,
    accountId: string,
    updateContactDto: UpdateContactDto,
  ) {
    // Verify client exists and belongs to account
    await this.findById(clientId, accountId);

    const contact = await this.contactRepository.findOne({
      where: { id: contactId, clientId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If setting this contact as primary, unset any existing primary contact
      if (updateContactDto.isPrimary === true) {
        await queryRunner.manager.update(
          ClientContact,
          { clientId, isPrimary: true, id: Not(contactId) },
          { isPrimary: false },
        );
      }

      Object.assign(contact, updateContactDto);
      const savedContact = await queryRunner.manager.save(ClientContact, contact);

      await queryRunner.commitTransaction();

      return savedContact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update contact: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteContact(contactId: string, accountId: string) {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId },
      relations: ['client'],
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    // Verify the contact's client belongs to the account
    if (contact.client.accountId !== accountId) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    await this.contactRepository.remove(contact);

    return {
      message: 'Contact deleted successfully',
      id: contactId,
    };
  }

  async addAddress(clientId: string, accountId: string, createAddressDto: CreateAddressDto) {
    const client = await this.findById(clientId, accountId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If this address is being set as primary, unset any existing primary address
      if (createAddressDto.isPrimary) {
        await queryRunner.manager.update(
          ClientAddress,
          { clientId, isPrimary: true },
          { isPrimary: false },
        );
      }

      // Geocoding placeholder - in production, integrate with a geocoding service
      const coordinates = await this.geocodeAddress(createAddressDto);

      const address = this.addressRepository.create({
        ...createAddressDto,
        clientId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      const savedAddress = await queryRunner.manager.save(ClientAddress, address);

      await queryRunner.commitTransaction();

      return savedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to add address: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAddress(
    clientId: string,
    addressId: string,
    accountId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    // Verify client exists and belongs to account
    await this.findById(clientId, accountId);

    const address = await this.addressRepository.findOne({
      where: { id: addressId, clientId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If setting this address as primary, unset any existing primary address
      if (updateAddressDto.isPrimary === true) {
        await queryRunner.manager.update(
          ClientAddress,
          { clientId, isPrimary: true, id: Not(addressId) },
          { isPrimary: false },
        );
      }

      // If address fields changed, re-geocode
      if (
        updateAddressDto.street1 ||
        updateAddressDto.city ||
        updateAddressDto.state ||
        updateAddressDto.postalCode
      ) {
        const addressToGeocode = { ...address, ...updateAddressDto };
        const coordinates = await this.geocodeAddress(addressToGeocode);
        Object.assign(address, updateAddressDto, coordinates);
      } else {
        Object.assign(address, updateAddressDto);
      }

      const savedAddress = await queryRunner.manager.save(ClientAddress, address);

      await queryRunner.commitTransaction();

      return savedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update address: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAddress(addressId: string, accountId: string) {
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
      relations: ['client'],
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    // Verify the address's client belongs to the account
    if (address.client.accountId !== accountId) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    await this.addressRepository.remove(address);

    return {
      message: 'Address deleted successfully',
      id: addressId,
    };
  }

  async getHistory(clientId: string, accountId: string) {
    const client = await this.findById(clientId, accountId);

    const [quotes, jobs, invoices] = await Promise.all([
      this.quoteRepository.find({
        where: { clientId, accountId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.jobRepository.find({
        where: { clientId, accountId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.invoiceRepository.find({
        where: { clientId, accountId },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    return {
      client,
      quotes,
      jobs,
      invoices,
    };
  }

  /**
   * Helper method to handle primary contact logic
   */
  private async handlePrimaryContact(
    contacts: CreateContactDto[],
    clientId: string,
    queryRunner: any,
  ) {
    const primaryCount = contacts.filter((c) => c.isPrimary).length;

    if (primaryCount > 1) {
      throw new BadRequestException('Only one contact can be marked as primary');
    }

    for (const contactDto of contacts) {
      const contact = this.contactRepository.create({
        ...contactDto,
        clientId,
      });
      await queryRunner.manager.save(ClientContact, contact);
    }
  }

  /**
   * Helper method to handle primary address logic
   */
  private async handlePrimaryAddress(
    addresses: CreateAddressDto[],
    clientId: string,
    queryRunner: any,
  ) {
    const primaryCount = addresses.filter((a) => a.isPrimary).length;

    if (primaryCount > 1) {
      throw new BadRequestException('Only one address can be marked as primary');
    }

    for (const addressDto of addresses) {
      const coordinates = await this.geocodeAddress(addressDto);
      const address = this.addressRepository.create({
        ...addressDto,
        clientId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      await queryRunner.manager.save(ClientAddress, address);
    }
  }

  /**
   * Geocode an address to get coordinates
   * This is a placeholder - in production, integrate with Google Maps API, Mapbox, etc.
   */
  private async geocodeAddress(address: any): Promise<{ latitude: number; longitude: number }> {
    // Placeholder implementation - log the address and return null coordinates
    this.logger.log(
      `Geocoding address: ${address.street1}, ${address.city}, ${address.state} ${address.postalCode}`,
    );

    // In production, you would call a geocoding service here:
    // const response = await this.geocodingService.geocode(address);
    // return { latitude: response.lat, longitude: response.lng };

    return { latitude: null, longitude: null };
  }
}

// Import Not operator for TypeORM
import { Not } from 'typeorm';
