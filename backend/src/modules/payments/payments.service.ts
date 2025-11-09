import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Refund } from '../../database/entities/refund.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Client } from '../../database/entities/client.entity';
import { Sequence } from '../../database/entities/sequence.entity';
import { StripeService } from '../../integrations/stripe/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { ProcessBankPaymentDto } from './dto/process-bank-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Sequence)
    private readonly sequenceRepository: Repository<Sequence>,
    private readonly stripeService: StripeService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(accountId: string, query: PaymentsQueryDto) {
    const {
      page = 1,
      limit = 50,
      status,
      clientId,
      invoiceId,
      startDate,
      endDate,
      search,
    } = query;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.client', 'client')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('payment.refunds', 'refunds')
      .where('payment.accountId = :accountId', { accountId })
      .orderBy('payment.paymentDate', 'DESC');

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (clientId) {
      queryBuilder.andWhere('payment.clientId = :clientId', { clientId });
    }

    if (invoiceId) {
      queryBuilder.andWhere('payment.invoiceId = :invoiceId', { invoiceId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('payment.paymentDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('payment.paymentDate <= :endDate', { endDate });
    }

    if (search) {
      queryBuilder.andWhere(
        '(payment.paymentNumber ILIKE :search OR payment.notes ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [payments, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments,
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

  async findById(id: string, accountId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, accountId },
      relations: ['client', 'invoice', 'refunds'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async create(
    accountId: string,
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    const { invoiceId, amount, paymentMethod, notes, paymentDate } = createPaymentDto;

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, accountId },
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (amount > Number(invoice.balanceDue)) {
      throw new BadRequestException(
        `Payment amount ($${amount}) exceeds balance due ($${invoice.balanceDue})`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const paymentNumber = await this.generatePaymentNumber(accountId, queryRunner);

      const payment = queryRunner.manager.create(Payment, {
        accountId,
        clientId: invoice.clientId,
        invoiceId,
        paymentNumber,
        amount,
        currency: 'USD',
        paymentMethod,
        paymentProcessor: null,
        status: 'completed',
        processorPaymentId: null,
        processorChargeId: null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        settledDate: new Date(),
        notes,
        createdBy: userId,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      await this.allocatePaymentToInvoice(savedPayment.id, invoiceId, amount, queryRunner);

      await queryRunner.commitTransaction();

      this.logger.log(`Manual payment recorded: ${paymentNumber} for invoice ${invoice.invoiceNumber}`);

      return this.findById(savedPayment.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processCardPayment(
    accountId: string,
    userId: string,
    processCardPaymentDto: ProcessCardPaymentDto,
  ): Promise<Payment> {
    const { invoiceId, amount, paymentMethodId, saveCard, notes } = processCardPaymentDto;

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, accountId },
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (amount > Number(invoice.balanceDue)) {
      throw new BadRequestException(
        `Payment amount ($${amount}) exceeds balance due ($${invoice.balanceDue})`,
      );
    }

    const client = invoice.client;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stripeCustomerId = client.customFields?.stripeCustomerId;

      if (!stripeCustomerId) {
        const stripeCustomer = await this.stripeService.createCustomer(
          client.email,
          `${client.firstName} ${client.lastName}`,
          {
            accountId,
            clientId: client.id,
          },
        );

        stripeCustomerId = stripeCustomer.id;

        client.customFields = {
          ...client.customFields,
          stripeCustomerId,
        };

        await queryRunner.manager.save(Client, client);
      }

      if (saveCard) {
        await this.stripeService.attachPaymentMethod(stripeCustomerId, paymentMethodId);
      }

      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount,
        'usd',
        paymentMethodId,
        stripeCustomerId,
        {
          accountId,
          clientId: client.id,
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
        },
      );

      const paymentNumber = await this.generatePaymentNumber(accountId, queryRunner);

      let cardLast4: string | null = null;
      let cardBrand: string | null = null;

      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
        const pm = paymentIntent.payment_method as any;
        if (pm.card) {
          cardLast4 = pm.card.last4;
          cardBrand = pm.card.brand;
        }
      }

      const payment = queryRunner.manager.create(Payment, {
        accountId,
        clientId: invoice.clientId,
        invoiceId,
        paymentNumber,
        amount,
        currency: 'USD',
        paymentMethod: 'card',
        paymentProcessor: 'stripe',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing',
        processorPaymentId: paymentIntent.id,
        processorChargeId: paymentIntent.latest_charge as string,
        cardLast4,
        cardBrand,
        processingFee: 0,
        netAmount: amount,
        paymentDate: new Date(),
        settledDate: paymentIntent.status === 'succeeded' ? new Date() : null,
        notes,
        createdBy: userId,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      if (paymentIntent.status === 'succeeded') {
        await this.allocatePaymentToInvoice(savedPayment.id, invoiceId, amount, queryRunner);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Card payment processed: ${paymentNumber} for invoice ${invoice.invoiceNumber}`,
      );

      return this.findById(savedPayment.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process card payment: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processBankPayment(
    accountId: string,
    userId: string,
    processBankPaymentDto: ProcessBankPaymentDto,
  ): Promise<Payment> {
    const { invoiceId, amount, bankAccountToken, notes } = processBankPaymentDto;

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, accountId },
      relations: ['client'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (amount > Number(invoice.balanceDue)) {
      throw new BadRequestException(
        `Payment amount ($${amount}) exceeds balance due ($${invoice.balanceDue})`,
      );
    }

    const client = invoice.client;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stripeCustomerId = client.customFields?.stripeCustomerId;

      if (!stripeCustomerId) {
        const stripeCustomer = await this.stripeService.createCustomer(
          client.email,
          `${client.firstName} ${client.lastName}`,
          {
            accountId,
            clientId: client.id,
          },
        );

        stripeCustomerId = stripeCustomer.id;

        client.customFields = {
          ...client.customFields,
          stripeCustomerId,
        };

        await queryRunner.manager.save(Client, client);
      }

      await this.stripeService.attachPaymentMethod(stripeCustomerId, bankAccountToken);

      const paymentIntent = await this.stripeService.createPaymentIntent(
        amount,
        'usd',
        bankAccountToken,
        stripeCustomerId,
        {
          accountId,
          clientId: client.id,
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
        },
      );

      const paymentNumber = await this.generatePaymentNumber(accountId, queryRunner);

      const payment = queryRunner.manager.create(Payment, {
        accountId,
        clientId: invoice.clientId,
        invoiceId,
        paymentNumber,
        amount,
        currency: 'USD',
        paymentMethod: 'bank',
        paymentProcessor: 'stripe',
        status: 'processing',
        processorPaymentId: paymentIntent.id,
        processorChargeId: paymentIntent.latest_charge as string,
        processingFee: 0,
        netAmount: amount,
        paymentDate: new Date(),
        notes,
        createdBy: userId,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Bank payment initiated: ${paymentNumber} for invoice ${invoice.invoiceNumber}`,
      );

      return this.findById(savedPayment.id, accountId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process bank payment: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refund(
    id: string,
    accountId: string,
    userId: string,
    refundPaymentDto: RefundPaymentDto,
  ): Promise<Refund> {
    const { amount, reason } = refundPaymentDto;

    const payment = await this.findById(id, accountId);

    if (payment.status !== 'completed' && payment.status !== 'settled') {
      throw new BadRequestException('Can only refund completed or settled payments');
    }

    const totalRefunded = payment.refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const refundableAmount = Number(payment.amount) - totalRefunded;

    if (refundableAmount <= 0) {
      throw new BadRequestException('Payment has already been fully refunded');
    }

    const refundAmount = amount || refundableAmount;

    if (refundAmount > refundableAmount) {
      throw new BadRequestException(
        `Refund amount ($${refundAmount}) exceeds refundable amount ($${refundableAmount})`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stripeRefund: any = null;

      if (payment.paymentProcessor === 'stripe' && payment.processorChargeId) {
        stripeRefund = await this.stripeService.createRefund(
          payment.processorChargeId,
          refundAmount,
          reason,
          {
            accountId,
            paymentId: payment.id,
            paymentNumber: payment.paymentNumber,
          },
        );
      }

      const refund = queryRunner.manager.create(Refund, {
        paymentId: payment.id,
        amount: refundAmount,
        reason,
        status: stripeRefund ? 'completed' : 'pending',
        processorRefundId: stripeRefund?.id,
        refundedAt: stripeRefund ? new Date() : null,
        createdBy: userId,
      });

      const savedRefund = await queryRunner.manager.save(Refund, refund);

      if (stripeRefund && payment.invoiceId) {
        const invoice = await queryRunner.manager.findOne(Invoice, {
          where: { id: payment.invoiceId },
        });

        if (invoice) {
          invoice.amountPaid = Number(invoice.amountPaid) - refundAmount;
          invoice.balanceDue = Number(invoice.balanceDue) + refundAmount;

          if (invoice.status === 'paid') {
            invoice.status = invoice.balanceDue > 0 ? 'partial' : 'paid';
          }

          await queryRunner.manager.save(Invoice, invoice);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Refund processed: $${refundAmount} for payment ${payment.paymentNumber}`);

      return savedRefund;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process refund: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listPaymentMethods(accountId: string, clientId: string): Promise<any[]> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId, accountId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    const stripeCustomerId = client.customFields?.stripeCustomerId;

    if (!stripeCustomerId) {
      return [];
    }

    try {
      const paymentMethods = await this.stripeService.listPaymentMethods(stripeCustomerId);

      return paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : null,
        createdAt: new Date(pm.created * 1000),
      }));
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to list payment methods: ${error.message}`);
    }
  }

  async addPaymentMethod(
    accountId: string,
    addPaymentMethodDto: AddPaymentMethodDto,
  ): Promise<any> {
    const { clientId, paymentMethodId } = addPaymentMethodDto;

    const client = await this.clientRepository.findOne({
      where: { id: clientId, accountId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    try {
      let stripeCustomerId = client.customFields?.stripeCustomerId;

      if (!stripeCustomerId) {
        const stripeCustomer = await this.stripeService.createCustomer(
          client.email,
          `${client.firstName} ${client.lastName}`,
          {
            accountId,
            clientId: client.id,
          },
        );

        stripeCustomerId = stripeCustomer.id;

        client.customFields = {
          ...client.customFields,
          stripeCustomerId,
        };

        await this.clientRepository.save(client);
      }

      const paymentMethod = await this.stripeService.attachPaymentMethod(
        stripeCustomerId,
        paymentMethodId,
      );

      this.logger.log(
        `Payment method added for client ${client.id}: ${paymentMethod.id}`,
      );

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            }
          : null,
      };
    } catch (error) {
      this.logger.error(`Failed to add payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to add payment method: ${error.message}`);
    }
  }

  async removePaymentMethod(methodId: string, accountId: string): Promise<{ message: string }> {
    try {
      await this.stripeService.detachPaymentMethod(methodId);

      this.logger.log(`Payment method removed: ${methodId}`);

      return {
        message: 'Payment method removed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to remove payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to remove payment method: ${error.message}`);
    }
  }

  private async generatePaymentNumber(
    accountId: string,
    queryRunner?: any,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.sequenceRepository.manager;

    let sequence = await manager.findOne(Sequence, {
      where: {
        accountId,
        sequenceType: 'payment',
      },
    });

    if (!sequence) {
      sequence = manager.create(Sequence, {
        accountId,
        sequenceType: 'payment',
        prefix: 'PAY',
        currentValue: 0,
      });
    }

    sequence.currentValue += 1;
    await manager.save(Sequence, sequence);

    const paddedNumber = String(sequence.currentValue).padStart(5, '0');
    return `${sequence.prefix}-${paddedNumber}`;
  }

  private async allocatePaymentToInvoice(
    paymentId: string,
    invoiceId: string,
    amount: number,
    queryRunner?: any,
  ): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.invoiceRepository.manager;

    const invoice = await manager.findOne(Invoice, {
      where: { id: invoiceId },
      relations: ['payments'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const totalPaid = invoice.payments
      .filter((p) => p.status === 'completed' || p.status === 'settled')
      .reduce((sum, p) => sum + Number(p.amount), 0) + amount;

    invoice.amountPaid = totalPaid;
    invoice.balanceDue = Number(invoice.total) - totalPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    } else if (totalPaid > 0 && invoice.balanceDue > 0) {
      invoice.status = 'partial';
    }

    await manager.save(Invoice, invoice);

    this.logger.log(`Payment allocated to invoice: ${invoice.invoiceNumber}`);
  }
}
