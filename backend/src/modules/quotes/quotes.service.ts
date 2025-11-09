import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThan } from 'typeorm';
import { Quote } from '../../database/entities/quote.entity';
import { QuoteLineItem } from '../../database/entities/quote-line-item.entity';
import { Client } from '../../database/entities/client.entity';
import { Job } from '../../database/entities/job.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { DeclineQuoteDto } from './dto/decline-quote.dto';
import { QuotesQueryDto } from './dto/quotes-query.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteLineItem)
    private lineItemRepository: Repository<QuoteLineItem>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Sequence)
    private sequenceRepository: Repository<Sequence>,
    private dataSource: DataSource,
  ) {}

  async findAll(accountId: string, query: QuotesQueryDto) {
    const {
      page = 1,
      limit = 50,
      status,
      clientId,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.client', 'client')
      .leftJoinAndSelect('quote.lineItems', 'lineItems')
      .where('quote.accountId = :accountId', { accountId })
      .orderBy('lineItems.sortOrder', 'ASC');

    if (status) {
      queryBuilder.andWhere('quote.status = :status', { status });
    }

    if (clientId) {
      queryBuilder.andWhere('quote.clientId = :clientId', { clientId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('quote.quoteDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('quote.quoteDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('quote.quoteDate <= :endDate', { endDate });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    queryBuilder.orderBy('quote.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const quotes = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: quotes,
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

  async create(accountId: string, userId: string, createQuoteDto: CreateQuoteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const client = await this.clientRepository.findOne({
        where: { id: createQuoteDto.clientId, accountId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const quoteNumber = await this.generateQuoteNumber(accountId, queryRunner);

      const { lineItems, taxRate, discountAmount, terms, ...quoteData } = createQuoteDto;

      const totals = this.calculateTotals(lineItems, taxRate || 0, discountAmount || 0);

      const quote = this.quoteRepository.create({
        ...quoteData,
        accountId,
        quoteNumber,
        createdBy: userId,
        status: 'draft',
        subtotal: totals.subtotal,
        taxRate: taxRate || 0,
        taxAmount: totals.taxAmount,
        discountAmount: discountAmount || 0,
        total: totals.total,
        termsAndConditions: terms,
      });

      const savedQuote = await queryRunner.manager.save(Quote, quote);

      const lineItemsToSave = lineItems.map((item, index) => {
        const totalPrice = Number(item.quantity) * Number(item.unitPrice);
        return this.lineItemRepository.create({
          ...item,
          quoteId: savedQuote.id,
          sortOrder: index,
          totalPrice,
        });
      });

      await queryRunner.manager.save(QuoteLineItem, lineItemsToSave);

      await queryRunner.commitTransaction();

      return this.findById(savedQuote.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create quote: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string, accountId: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id, accountId },
      relations: ['client', 'lineItems', 'address'],
      order: {
        lineItems: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    return quote;
  }

  async update(id: string, accountId: string, updateQuoteDto: UpdateQuoteDto) {
    const quote = await this.findById(id, accountId);

    if (quote.status === 'approved' || quote.status === 'converted') {
      throw new BadRequestException(
        `Cannot update quote with status: ${quote.status}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { lineItems, taxRate, discountAmount, terms, ...quoteData } = updateQuoteDto;

      if (lineItems) {
        await queryRunner.manager.delete(QuoteLineItem, { quoteId: id });

        const totals = this.calculateTotals(
          lineItems,
          taxRate !== undefined ? taxRate : quote.taxRate,
          discountAmount !== undefined ? discountAmount : quote.discountAmount,
        );

        const lineItemsToSave = lineItems.map((item, index) => {
          const totalPrice = Number(item.quantity) * Number(item.unitPrice);
          return this.lineItemRepository.create({
            ...item,
            quoteId: id,
            sortOrder: index,
            totalPrice,
          });
        });

        await queryRunner.manager.save(QuoteLineItem, lineItemsToSave);

        Object.assign(quote, quoteData, {
          subtotal: totals.subtotal,
          taxRate: taxRate !== undefined ? taxRate : quote.taxRate,
          taxAmount: totals.taxAmount,
          discountAmount: discountAmount !== undefined ? discountAmount : quote.discountAmount,
          total: totals.total,
        });
      } else {
        Object.assign(quote, quoteData);

        if (taxRate !== undefined || discountAmount !== undefined) {
          const existingLineItems = await this.lineItemRepository.find({
            where: { quoteId: id },
            order: { sortOrder: 'ASC' },
          });

          const totals = this.calculateTotals(
            existingLineItems.map(li => ({
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              isTaxable: li.isTaxable,
            })),
            taxRate !== undefined ? taxRate : quote.taxRate,
            discountAmount !== undefined ? discountAmount : quote.discountAmount,
          );

          quote.taxRate = taxRate !== undefined ? taxRate : quote.taxRate;
          quote.discountAmount = discountAmount !== undefined ? discountAmount : quote.discountAmount;
          quote.subtotal = totals.subtotal;
          quote.taxAmount = totals.taxAmount;
          quote.total = totals.total;
        }
      }

      if (terms !== undefined) {
        quote.termsAndConditions = terms;
      }

      const savedQuote = await queryRunner.manager.save(Quote, quote);

      await queryRunner.commitTransaction();

      return this.findById(savedQuote.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update quote: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, accountId: string) {
    const quote = await this.findById(id, accountId);

    if (quote.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete quote with status: ${quote.status}. Only draft quotes can be deleted.`,
      );
    }

    await this.quoteRepository.softDelete(id);

    return {
      message: 'Quote deleted successfully',
      id,
    };
  }

  async sendQuote(id: string, accountId: string) {
    const quote = await this.findById(id, accountId);

    if (quote.status === 'approved' || quote.status === 'converted') {
      throw new BadRequestException(
        `Cannot send quote with status: ${quote.status}`,
      );
    }

    quote.status = 'sent';
    await this.quoteRepository.save(quote);

    this.logger.log(`Quote ${quote.quoteNumber} sent to client ${quote.client.email}`);
    console.log(`[EMAIL] Sending quote ${quote.quoteNumber} to ${quote.client.email}`);
    console.log(`[EMAIL] Subject: Quote ${quote.quoteNumber} - ${quote.title}`);
    console.log(`[EMAIL] Quote total: $${quote.total}`);

    return {
      message: 'Quote sent successfully',
      quote: await this.findById(id, accountId),
    };
  }

  async approveQuote(id: string, approveDto: ApproveQuoteDto) {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['client', 'lineItems'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status === 'approved') {
      throw new BadRequestException('Quote has already been approved');
    }

    if (quote.status === 'declined') {
      throw new BadRequestException('Cannot approve a declined quote');
    }

    if (quote.status === 'expired') {
      throw new BadRequestException('Cannot approve an expired quote');
    }

    quote.status = 'approved';
    quote.approvedAt = new Date();
    quote.signatureData = approveDto.signature;
    quote.signatureIp = approveDto.ipAddress;

    await this.quoteRepository.save(quote);

    this.logger.log(`Quote ${quote.quoteNumber} approved by client`);

    return {
      message: 'Quote approved successfully',
      quote,
    };
  }

  async declineQuote(id: string, declineDto: DeclineQuoteDto) {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['client', 'lineItems'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status === 'approved') {
      throw new BadRequestException('Cannot decline an approved quote');
    }

    if (quote.status === 'declined') {
      throw new BadRequestException('Quote has already been declined');
    }

    quote.status = 'declined';
    quote.declinedAt = new Date();
    quote.declineReason = declineDto.reason;

    await this.quoteRepository.save(quote);

    this.logger.log(`Quote ${quote.quoteNumber} declined by client`);

    return {
      message: 'Quote declined successfully',
      quote,
    };
  }

  async convertToJob(id: string, accountId: string) {
    const quote = await this.findById(id, accountId);

    if (quote.status !== 'approved') {
      throw new BadRequestException(
        'Only approved quotes can be converted to jobs',
      );
    }

    if (quote.convertedToJobId) {
      throw new BadRequestException('Quote has already been converted to a job');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const jobNumber = await this.generateJobNumber(accountId, queryRunner);

      const job = this.jobRepository.create({
        accountId,
        clientId: quote.clientId,
        addressId: quote.addressId,
        quoteId: quote.id,
        jobNumber,
        title: quote.title,
        description: quote.description,
        status: 'scheduled',
        estimatedValue: quote.total,
        createdBy: quote.createdBy,
      });

      const savedJob = await queryRunner.manager.save(Job, job);

      quote.status = 'converted';
      quote.convertedToJobId = savedJob.id;
      await queryRunner.manager.save(Quote, quote);

      await queryRunner.commitTransaction();

      this.logger.log(`Quote ${quote.quoteNumber} converted to job ${jobNumber}`);

      return {
        message: 'Quote converted to job successfully',
        job: savedJob,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to convert quote to job: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async checkExpiry() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredQuotes = await this.quoteRepository.find({
      where: {
        status: 'sent',
        expiryDate: LessThan(today),
      },
    });

    for (const quote of expiredQuotes) {
      quote.status = 'expired';
      await this.quoteRepository.save(quote);
      this.logger.log(`Quote ${quote.quoteNumber} marked as expired`);
    }

    return {
      message: `Marked ${expiredQuotes.length} quotes as expired`,
      count: expiredQuotes.length,
    };
  }

  private calculateTotals(
    lineItems: any[],
    taxRate: number,
    discountAmount: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lineItems.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      return sum + itemTotal;
    }, 0);

    const taxableAmount = lineItems.reduce((sum, item) => {
      if (item.isTaxable !== false) {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        return sum + itemTotal;
      }
      return sum;
    }, 0);

    const taxAmount = taxableAmount * Number(taxRate);

    const total = subtotal + taxAmount - Number(discountAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  private async generateQuoteNumber(accountId: string, queryRunner: any): Promise<string> {
    let sequence = await queryRunner.manager.findOne(Sequence, {
      where: { accountId, sequenceType: 'quote' },
    });

    if (!sequence) {
      sequence = queryRunner.manager.create(Sequence, {
        accountId,
        sequenceType: 'quote',
        prefix: 'Q',
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    await queryRunner.manager.save(Sequence, sequence);

    const paddedNumber = String(sequence.currentValue).padStart(5, '0');
    return `${sequence.prefix}-${paddedNumber}`;
  }

  private async generateJobNumber(accountId: string, queryRunner: any): Promise<string> {
    let sequence = await queryRunner.manager.findOne(Sequence, {
      where: { accountId, sequenceType: 'job' },
    });

    if (!sequence) {
      sequence = queryRunner.manager.create(Sequence, {
        accountId,
        sequenceType: 'job',
        prefix: 'J',
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    await queryRunner.manager.save(Sequence, sequence);

    const paddedNumber = String(sequence.currentValue).padStart(5, '0');
    return `${sequence.prefix}-${paddedNumber}`;
  }
}
