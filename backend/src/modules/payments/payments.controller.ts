import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { ProcessBankPaymentDto } from './dto/process-bank-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all payments',
    description: 'Get a paginated list of payments with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            paymentNumber: 'PAY-00001',
            amount: 108.75,
            paymentMethod: 'card',
            status: 'completed',
            paymentDate: '2025-03-15T10:30:00.000Z',
            cardLast4: '4242',
            cardBrand: 'visa',
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
            },
            invoice: {
              id: '770e8400-e29b-41d4-a716-446655440000',
              invoiceNumber: 'INV-00001',
            },
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('accountId') accountId: string,
    @Query() query: PaymentsQueryDto,
  ) {
    return this.paymentsService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Record a manual payment',
    description: 'Record a manual payment (cash, check, etc.) for an invoice',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        paymentNumber: 'PAY-00001',
        amount: 108.75,
        paymentMethod: 'cash',
        status: 'completed',
        paymentDate: '2025-03-15T10:30:00.000Z',
        notes: 'Payment received in cash',
        invoice: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          invoiceNumber: 'INV-00001',
          balanceDue: 0,
          status: 'paid',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or payment exceeds balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async create(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(accountId, userId, createPaymentDto);
  }

  @Post('card')
  @ApiOperation({
    summary: 'Process a card payment',
    description: 'Process a credit/debit card payment via Stripe',
  })
  @ApiResponse({
    status: 201,
    description: 'Card payment processed successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        paymentNumber: 'PAY-00001',
        amount: 108.75,
        paymentMethod: 'card',
        paymentProcessor: 'stripe',
        status: 'completed',
        processorPaymentId: 'pi_1234567890',
        cardLast4: '4242',
        cardBrand: 'visa',
        paymentDate: '2025-03-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - payment failed or exceeds balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async processCardPayment(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() processCardPaymentDto: ProcessCardPaymentDto,
  ) {
    return this.paymentsService.processCardPayment(accountId, userId, processCardPaymentDto);
  }

  @Post('bank')
  @ApiOperation({
    summary: 'Process a bank payment',
    description: 'Process an ACH/bank transfer payment via Stripe',
  })
  @ApiResponse({
    status: 201,
    description: 'Bank payment initiated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        paymentNumber: 'PAY-00001',
        amount: 108.75,
        paymentMethod: 'bank',
        paymentProcessor: 'stripe',
        status: 'processing',
        processorPaymentId: 'pi_1234567890',
        paymentDate: '2025-03-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - payment failed or exceeds balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async processBankPayment(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() processBankPaymentDto: ProcessBankPaymentDto,
  ) {
    return this.paymentsService.processBankPayment(accountId, userId, processBankPaymentDto);
  }

  @Get('methods')
  @ApiOperation({
    summary: 'List saved payment methods',
    description: 'List all saved payment methods for a client',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
    schema: {
      example: [
        {
          id: 'pm_1234567890',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025,
          },
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async listPaymentMethods(
    @CurrentUser('accountId') accountId: string,
    @Query('clientId') clientId: string,
  ) {
    return this.paymentsService.listPaymentMethods(accountId, clientId);
  }

  @Post('methods')
  @ApiOperation({
    summary: 'Add a payment method',
    description: 'Save a new payment method (card or bank account) via Stripe',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment method added successfully',
    schema: {
      example: {
        id: 'pm_1234567890',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payment method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async addPaymentMethod(
    @CurrentUser('accountId') accountId: string,
    @Body() addPaymentMethodDto: AddPaymentMethodDto,
  ) {
    return this.paymentsService.addPaymentMethod(accountId, addPaymentMethodDto);
  }

  @Delete('methods/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a payment method',
    description: 'Remove a saved payment method from Stripe',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment method ID',
    example: 'pm_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method removed successfully',
    schema: {
      example: {
        message: 'Payment method removed successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - failed to remove payment method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removePaymentMethod(
    @Param('id') methodId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.paymentsService.removePaymentMethod(methodId, accountId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Get a single payment by ID with related data',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        paymentNumber: 'PAY-00001',
        amount: 108.75,
        paymentMethod: 'card',
        status: 'completed',
        paymentDate: '2025-03-15T10:30:00.000Z',
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
        },
        invoice: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          invoiceNumber: 'INV-00001',
        },
        refunds: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.paymentsService.findById(id, accountId);
  }

  @Post(':id/refund')
  @ApiOperation({
    summary: 'Refund a payment',
    description: 'Process a full or partial refund for a payment',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Refund processed successfully',
    schema: {
      example: {
        id: '880e8400-e29b-41d4-a716-446655440000',
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 50.00,
        reason: 'Customer requested refund',
        status: 'completed',
        processorRefundId: 're_1234567890',
        refundedAt: '2025-03-16T14:20:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot refund or exceeds refundable amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refund(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(id, accountId, userId, refundPaymentDto);
  }
}
