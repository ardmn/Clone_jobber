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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { DeclineQuoteDto } from './dto/decline-quote.dto';
import { QuotesQueryDto } from './dto/quotes-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @ApiOperation({
    summary: 'List all quotes',
    description: 'Get a paginated list of quotes with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Quotes retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            quoteNumber: 'Q-00001',
            title: 'Monthly Lawn Care Package',
            status: 'sent',
            subtotal: 200.00,
            taxAmount: 16.50,
            discountAmount: 0,
            total: 216.50,
            quoteDate: '2025-01-15',
            expiryDate: '2025-02-15',
            client: {
              id: '660e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
            },
            lineItems: [],
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
    @Query() query: QuotesQueryDto,
  ) {
    return this.quotesService.findAll(accountId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new quote',
    description: 'Create a new quote with line items. Automatically calculates totals.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        quoteNumber: 'Q-00001',
        title: 'Monthly Lawn Care Package',
        description: 'Comprehensive lawn care services',
        status: 'draft',
        subtotal: 200.00,
        taxRate: 0.0825,
        taxAmount: 16.50,
        discountAmount: 0,
        total: 216.50,
        depositRequired: false,
        depositAmount: null,
        quoteDate: '2025-01-15',
        expiryDate: '2025-02-15',
        introduction: 'Thank you for your interest',
        termsAndConditions: 'Payment due in 30 days',
        lineItems: [
          {
            id: '770e8400-e29b-41d4-a716-446655440000',
            itemType: 'service',
            name: 'Lawn Mowing',
            quantity: 4,
            unitPrice: 50.00,
            totalPrice: 200.00,
            isTaxable: true,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async create(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() createQuoteDto: CreateQuoteDto,
  ) {
    return this.quotesService.create(accountId, userId, createQuoteDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get quote by ID',
    description: 'Get a single quote by ID with line items and client details',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        quoteNumber: 'Q-00001',
        title: 'Monthly Lawn Care Package',
        status: 'sent',
        subtotal: 200.00,
        taxAmount: 16.50,
        total: 216.50,
        client: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        lineItems: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.quotesService.findById(id, accountId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a quote',
    description: 'Update quote details and line items. Cannot update approved or converted quotes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update quote in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, accountId, updateQuoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a quote',
    description: 'Soft delete a quote. Only draft quotes can be deleted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote deleted successfully',
    schema: {
      example: {
        message: 'Quote deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot delete quote in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.quotesService.delete(id, accountId);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send quote to client',
    description: 'Send the quote to the client via email and update status to "sent"',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote sent successfully',
    schema: {
      example: {
        message: 'Quote sent successfully',
        quote: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'sent',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot send quote in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async sendQuote(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.quotesService.sendQuote(id, accountId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve quote (client portal)',
    description: 'Client approves the quote with signature. This is a public endpoint accessed via token.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote approved successfully',
    schema: {
      example: {
        message: 'Quote approved successfully',
        quote: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'approved',
          approvedAt: '2025-01-20T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot approve quote in current status' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async approveQuote(
    @Param('id') id: string,
    @Body() approveDto: ApproveQuoteDto,
  ) {
    return this.quotesService.approveQuote(id, approveDto);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline quote (client portal)',
    description: 'Client declines the quote with optional reason. This is a public endpoint accessed via token.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote declined successfully',
    schema: {
      example: {
        message: 'Quote declined successfully',
        quote: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'declined',
          declinedAt: '2025-01-20T10:30:00.000Z',
          declineReason: 'Found a better price',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot decline quote in current status' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async declineQuote(
    @Param('id') id: string,
    @Body() declineDto: DeclineQuoteDto,
  ) {
    return this.quotesService.declineQuote(id, declineDto);
  }

  @Post(':id/convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert quote to job',
    description: 'Convert an approved quote to a job. Only approved quotes can be converted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote converted to job successfully',
    schema: {
      example: {
        message: 'Quote converted to job successfully',
        job: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          jobNumber: 'J-00001',
          title: 'Monthly Lawn Care Package',
          status: 'scheduled',
          quoteId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Only approved quotes can be converted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async convertToJob(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.quotesService.convertToJob(id, accountId);
  }

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Generate quote PDF',
    description: 'Generate a PDF version of the quote (placeholder - returns quote data)',
  })
  @ApiParam({
    name: 'id',
    description: 'Quote ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generation placeholder',
    schema: {
      example: {
        message: 'PDF generation not yet implemented. This would return a PDF buffer.',
        quote: {},
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async generatePdf(
    @Param('id') id: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    const quote = await this.quotesService.findById(id, accountId);
    return {
      message: 'PDF generation not yet implemented. This would return a PDF buffer.',
      quote,
    };
  }
}
