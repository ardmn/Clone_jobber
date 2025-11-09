import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Invoice } from '../../database/entities/invoice.entity';
import { InvoiceLineItem } from '../../database/entities/invoice-line-item.entity';
import { Client } from '../../database/entities/client.entity';
import { Job } from '../../database/entities/job.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesQueryDto } from './dto/invoices-query.dto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLineItem)
    private readonly lineItemRepository: Repository<InvoiceLineItem>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Sequence)
    private readonly sequenceRepository: Repository<Sequence>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(accountId: string, query: InvoicesQueryDto) {
    const {
      page = 1,
      limit = 50,
      status,
      clientId,
      startDate,
      endDate,
      overdue,
      search,
    } = query;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('invoice.lineItems', 'lineItems')
      .where('invoice.accountId = :accountId', { accountId })
      .orderBy('invoice.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    if (clientId) {
      queryBuilder.andWhere('invoice.clientId = :clientId', { clientId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('invoice.invoiceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('invoice.invoiceDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('invoice.invoiceDate <= :endDate', { endDate });
    }

    if (overdue === true) {
      const today = new Date().toISOString().split('T')[0];
      queryBuilder.andWhere('invoice.dueDate < :today', { today });
      queryBuilder.andWhere('invoice.status NOT IN (:...paidStatuses)', {
        paidStatuses: ['paid', 'void'],
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(invoice.invoiceNumber ILIKE :search OR invoice.title ILIKE :search OR invoice.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [invoices, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: invoices,
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

  async findById(id: string, accountId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, accountId },
      relations: ['client', 'job', 'lineItems', 'payments'],
      order: {
        lineItems: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async create(
    accountId: string,
    userId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<Invoice> {
    const {
      clientId,
      jobId,
      title,
      description,
      lineItems,
      taxRate = 0,
      discountAmount = 0,
      dueDate,
      paymentTerms = 30,
      lateFeeEnabled = false,
      lateFeePercentage,
      notes,
      terms,
    } = createInvoiceDto;

    const client = await this.clientRepository.findOne({
      where: { id: clientId, accountId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    if (jobId) {
      const job = await this.jobRepository.findOne({
        where: { id: jobId, accountId },
      });

      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber(accountId, queryRunner);

      const invoiceDateObj = new Date();
      const dueDateObj = dueDate
        ? new Date(dueDate)
        : new Date(invoiceDateObj.getTime() + paymentTerms * 24 * 60 * 60 * 1000);

      const { subtotal, taxAmount, total } = this.calculateTotals(
        lineItems,
        taxRate,
        discountAmount,
      );

      const invoice = queryRunner.manager.create(Invoice, {
        accountId,
        clientId,
        jobId,
        invoiceNumber,
        title,
        description,
        status: 'draft',
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        total,
        amountPaid: 0,
        balanceDue: total,
        invoiceDate: invoiceDateObj,
        dueDate: dueDateObj,
        paymentTerms,
        lateFeeEnabled,
        lateFeePercentage,
        notes,
        termsAndConditions: terms,
        createdBy: userId,
      });

      const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

      const invoiceLineItems = lineItems.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice;

        return queryRunner.manager.create(InvoiceLineItem, {
          invoiceId: savedInvoice.id,
          sortOrder: index,
          itemType: item.itemType,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          isTaxable: item.isTaxable !== undefined ? item.isTaxable : true,
        });
      });

      await queryRunner.manager.save(InvoiceLineItem, invoiceLineItems);

      await queryRunner.commitTransaction();

      this.logger.log(`Invoice created: ${invoiceNumber} for account ${accountId}`);

      return this.findById(savedInvoice.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create invoice: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    accountId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findById(id, accountId);

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot update a paid invoice');
    }

    if (invoice.status === 'void') {
      throw new BadRequestException('Cannot update a voided invoice');
    }

    const {
      title,
      description,
      lineItems,
      taxRate,
      discountAmount,
      dueDate,
      paymentTerms,
      lateFeeEnabled,
      lateFeePercentage,
      notes,
      terms,
    } = updateInvoiceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (lineItems && lineItems.length > 0) {
        await queryRunner.manager.delete(InvoiceLineItem, { invoiceId: id });

        const newTaxRate = taxRate !== undefined ? taxRate : invoice.taxRate;
        const newDiscountAmount = discountAmount !== undefined ? discountAmount : invoice.discountAmount;

        const { subtotal, taxAmount, total } = this.calculateTotals(
          lineItems,
          Number(newTaxRate),
          Number(newDiscountAmount),
        );

        invoice.subtotal = subtotal;
        invoice.taxRate = newTaxRate;
        invoice.taxAmount = taxAmount;
        invoice.discountAmount = newDiscountAmount;
        invoice.total = total;
        invoice.balanceDue = total - Number(invoice.amountPaid);

        const invoiceLineItems = lineItems.map((item, index) => {
          const totalPrice = item.quantity * item.unitPrice;

          return queryRunner.manager.create(InvoiceLineItem, {
            invoiceId: id,
            sortOrder: index,
            itemType: item.itemType,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice,
            isTaxable: item.isTaxable !== undefined ? item.isTaxable : true,
          });
        });

        await queryRunner.manager.save(InvoiceLineItem, invoiceLineItems);
      }

      if (title !== undefined) invoice.title = title;
      if (description !== undefined) invoice.description = description;
      if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
      if (paymentTerms !== undefined) invoice.paymentTerms = paymentTerms;
      if (lateFeeEnabled !== undefined) invoice.lateFeeEnabled = lateFeeEnabled;
      if (lateFeePercentage !== undefined) invoice.lateFeePercentage = lateFeePercentage;
      if (notes !== undefined) invoice.notes = notes;
      if (terms !== undefined) invoice.termsAndConditions = terms;

      if (taxRate !== undefined && (!lineItems || lineItems.length === 0)) {
        invoice.taxRate = taxRate;
        const taxableSubtotal = Number(invoice.subtotal);
        invoice.taxAmount = taxableSubtotal * taxRate;
        invoice.total = taxableSubtotal + invoice.taxAmount - Number(invoice.discountAmount);
        invoice.balanceDue = invoice.total - Number(invoice.amountPaid);
      }

      if (discountAmount !== undefined && (!lineItems || lineItems.length === 0)) {
        invoice.discountAmount = discountAmount;
        invoice.total = Number(invoice.subtotal) + Number(invoice.taxAmount) - discountAmount;
        invoice.balanceDue = invoice.total - Number(invoice.amountPaid);
      }

      await queryRunner.manager.save(Invoice, invoice);

      await queryRunner.commitTransaction();

      this.logger.log(`Invoice updated: ${invoice.invoiceNumber}`);

      return this.findById(id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update invoice: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, accountId: string): Promise<{ message: string; id: string }> {
    const invoice = await this.findById(id, accountId);

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    if (Number(invoice.amountPaid) > 0) {
      throw new BadRequestException('Cannot delete an invoice with payments');
    }

    await this.invoiceRepository.softDelete(id);

    this.logger.log(`Invoice deleted: ${invoice.invoiceNumber}`);

    return {
      message: 'Invoice deleted successfully',
      id,
    };
  }

  async sendInvoice(id: string, accountId: string): Promise<Invoice> {
    const invoice = await this.findById(id, accountId);

    if (invoice.status === 'void') {
      throw new BadRequestException('Cannot send a voided invoice');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot send a paid invoice');
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();

    await this.invoiceRepository.save(invoice);

    console.log(`[EMAIL] Sending invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
    console.log(`[EMAIL] Invoice total: $${invoice.total}`);
    console.log(`[EMAIL] Due date: ${invoice.dueDate}`);

    this.logger.log(`Invoice sent: ${invoice.invoiceNumber}`);

    return this.findById(id, accountId);
  }

  async voidInvoice(id: string, accountId: string): Promise<Invoice> {
    const invoice = await this.findById(id, accountId);

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot void a paid invoice. Please refund payments first.');
    }

    if (Number(invoice.amountPaid) > 0) {
      throw new BadRequestException(
        'Cannot void an invoice with payments. Please refund payments first.',
      );
    }

    invoice.status = 'void';

    await this.invoiceRepository.save(invoice);

    this.logger.log(`Invoice voided: ${invoice.invoiceNumber}`);

    return this.findById(id, accountId);
  }

  async checkOverdue(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        dueDate: LessThan(today),
        status: 'sent',
      },
    });

    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue';
      await this.invoiceRepository.save(invoice);
    }

    if (overdueInvoices.length > 0) {
      this.logger.log(`Updated ${overdueInvoices.length} invoices to overdue status`);
    }
  }

  async sendReminders(accountId: string): Promise<void> {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const invoicesToRemind = await this.invoiceRepository.find({
      where: [
        {
          accountId,
          status: 'sent',
          dueDate: LessThanOrEqual(threeDaysFromNow),
        },
        {
          accountId,
          status: 'overdue',
        },
      ],
      relations: ['client'],
    });

    for (const invoice of invoicesToRemind) {
      const daysSinceLastReminder = invoice.lastReminderSentAt
        ? Math.floor(
            (today.getTime() - new Date(invoice.lastReminderSentAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      if (daysSinceLastReminder >= 7) {
        console.log(`[EMAIL] Sending payment reminder for invoice ${invoice.invoiceNumber}`);
        console.log(`[EMAIL] To: ${invoice.client.email}`);
        console.log(`[EMAIL] Balance due: $${invoice.balanceDue}`);

        invoice.lastReminderSentAt = today;
        invoice.reminderCount += 1;

        await this.invoiceRepository.save(invoice);

        this.logger.log(`Reminder sent for invoice: ${invoice.invoiceNumber}`);
      }
    }
  }

  async updateBalances(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['payments'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const totalPaid = invoice.payments
      .filter((payment) => payment.status === 'completed' || payment.status === 'settled')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    invoice.amountPaid = totalPaid;
    invoice.balanceDue = Number(invoice.total) - totalPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    } else if (totalPaid > 0 && invoice.balanceDue > 0) {
      invoice.status = 'partial';
    }

    await this.invoiceRepository.save(invoice);

    this.logger.log(`Invoice balances updated: ${invoice.invoiceNumber}`);
  }

  private async generateInvoiceNumber(
    accountId: string,
    queryRunner?: any,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.sequenceRepository.manager;

    let sequence = await manager.findOne(Sequence, {
      where: {
        accountId,
        sequenceType: 'invoice',
      },
    });

    if (!sequence) {
      sequence = manager.create(Sequence, {
        accountId,
        sequenceType: 'invoice',
        prefix: 'INV',
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    await manager.save(Sequence, sequence);

    const paddedNumber = String(sequence.currentValue).padStart(5, '0');
    return `${sequence.prefix}-${paddedNumber}`;
  }

  private calculateTotals(
    lineItems: any[],
    taxRate: number,
    discountAmount: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const taxableSubtotal = lineItems
      .filter((item) => item.isTaxable !== false)
      .reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0);

    const taxAmount = taxableSubtotal * taxRate;

    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  async getOverdueInvoices(accountId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        accountId,
        dueDate: LessThan(today),
        status: 'overdue',
      },
      relations: ['client', 'job', 'lineItems'],
      order: {
        dueDate: 'ASC',
      },
    });

    return {
      data: overdueInvoices,
      meta: {
        total: overdueInvoices.length,
        totalOverdueAmount: overdueInvoices.reduce(
          (sum, inv) => sum + Number(inv.balanceDue),
          0,
        ),
      },
    };
  }
}
