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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesQueryDto } from './dto/invoices-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List all invoices',
    description: 'Get a paginated list of invoices with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            invoiceNumber: 'INV-00001',
            title: 'Lawn Care Service - March 2025',
            status: 'sent',
            subtotal: 100.00,
            taxRate: 0.0875,
            taxAmount: 8.75,
            discountAmount: 0,
            total: 108.75,
            amountPaid: 0,
            balanceDue: 108.75,
            invoiceDate: '2025-03-01',
            dueDate: '2025-03-31',
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
            },
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
  async findAll(
    @CurrentUser('accountId') accountId: string,
    @Query() query: InvoicesQueryDto,
  ) {
    return this.invoicesService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description: 'Create a new invoice with line items. Can be created from a job or standalone.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceNumber: 'INV-00001',
        title: 'Lawn Care Service - March 2025',
        description: 'Monthly lawn care services',
        status: 'draft',
        subtotal: 100.00,
        taxRate: 0.0875,
        taxAmount: 8.75,
        discountAmount: 0,
        total: 108.75,
        amountPaid: 0,
        balanceDue: 108.75,
        invoiceDate: '2025-03-01',
        dueDate: '2025-03-31',
        paymentTerms: 30,
        lateFeeEnabled: false,
        notes: 'Thank you for your business',
        createdAt: '2025-03-01T00:00:00.000Z',
        lineItems: [
          {
            id: '770e8400-e29b-41d4-a716-446655440000',
            itemType: 'service',
            name: 'Lawn Mowing',
            description: 'Standard lawn mowing service',
            quantity: 1,
            unitPrice: 50.00,
            totalPrice: 50.00,
            isTaxable: true,
          },
        ],
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client or Job not found' })
  async create(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(accountId, userId, createInvoiceDto);
  }

  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue invoices',
    description: 'Get all overdue invoices for the account',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue invoices retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            invoiceNumber: 'INV-00001',
            title: 'Lawn Care Service - February 2025',
            status: 'overdue',
            balanceDue: 108.75,
            dueDate: '2025-02-28',
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
            },
          },
        ],
        meta: {
          total: 5,
          totalOverdueAmount: 543.75,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOverdue(@CurrentUser('accountId') accountId: string) {
    return this.invoicesService.getOverdueInvoices(accountId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Get a single invoice by ID with line items and payments',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceNumber: 'INV-00001',
        title: 'Lawn Care Service - March 2025',
        status: 'sent',
        subtotal: 100.00,
        taxAmount: 8.75,
        total: 108.75,
        balanceDue: 108.75,
        lineItems: [],
        payments: [],
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.invoicesService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an invoice',
    description: 'Update invoice information. Cannot update paid or voided invoices.',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceNumber: 'INV-00001',
        title: 'Updated Lawn Care Service',
        status: 'draft',
        total: 120.00,
        updatedAt: '2025-03-02T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update paid/voided invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, accountId, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an invoice',
    description: 'Soft delete an invoice. Cannot delete paid invoices or invoices with payments.',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice deleted successfully',
    schema: {
      example: {
        message: 'Invoice deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete paid invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.invoicesService.delete(id, accountId);
  }

  @Post(':id/send')
  @ApiOperation({
    summary: 'Send invoice via email',
    description: 'Mark invoice as sent and send it to the client via email',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice sent successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceNumber: 'INV-00001',
        status: 'sent',
        sentAt: '2025-03-01T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot send paid/voided invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async sendInvoice(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.invoicesService.sendInvoice(id, accountId);
  }

  @Post(':id/void')
  @ApiOperation({
    summary: 'Void an invoice',
    description: 'Mark invoice as void. Cannot void paid invoices or invoices with payments.',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice voided successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        invoiceNumber: 'INV-00001',
        status: 'void',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot void paid invoice' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async voidInvoice(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.invoicesService.voidInvoice(id, accountId);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Generate invoice PDF',
    description: 'Generate and download invoice as PDF (placeholder)',
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generation placeholder',
    schema: {
      example: {
        message: 'PDF generation not yet implemented',
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        placeholder: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async generatePdf(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    const invoice = await this.invoicesService.findById(id, accountId);

    return {
      message: 'PDF generation not yet implemented',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      placeholder: true,
    };
  }
}
