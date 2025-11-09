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
import { FilesService } from './files.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { FilesQueryDto } from './dto/files-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate presigned URL for file upload',
    description:
      'Generate a presigned S3 URL for uploading a file. The URL is valid for 5 minutes. After uploading to S3, call the confirm endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        fileId: '550e8400-e29b-41d4-a716-446655440000',
        uploadUrl:
          'https://bucket.s3.amazonaws.com/accounts/123/files/550e8400-e29b-41d4-a716-446655440000.pdf?...',
        key: 'accounts/123e4567-e89b-12d3-a456-426614174000/files/550e8400-e29b-41d4-a716-446655440000.pdf',
        expiresIn: 300,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateUploadUrl(
    @CurrentUser('accountId') accountId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateUploadUrlDto,
  ) {
    return this.filesService.generateUploadUrl(accountId, userId, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm file upload',
    description:
      'Confirm that the file was successfully uploaded to S3 and save the metadata to the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID returned from upload-url endpoint',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'File upload confirmed successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        fileName: 'invoice-receipt.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
        entityType: 'invoice',
        entityId: '660e8400-e29b-41d4-a716-446655440000',
        description: 'Invoice payment receipt',
        downloadUrl:
          'https://bucket.s3.amazonaws.com/accounts/123/files/550e8400-e29b-41d4-a716-446655440000.pdf?...',
        uploadedBy: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        createdAt: '2025-02-01T10:00:00.000Z',
        updatedAt: '2025-02-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - upload already confirmed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File record not found' })
  async confirmUpload(
    @Param('id') fileId: string,
    @CurrentUser('accountId') accountId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.filesService.confirmUpload(accountId, fileId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all files',
    description: 'Get a paginated list of files with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            fileName: 'invoice-receipt.pdf',
            mimeType: 'application/pdf',
            fileSize: 1048576,
            entityType: 'invoice',
            entityId: '660e8400-e29b-41d4-a716-446655440000',
            description: 'Invoice payment receipt',
            downloadUrl:
              'https://bucket.s3.amazonaws.com/accounts/123/files/550e8400-e29b-41d4-a716-446655440000.pdf?...',
            uploadedBy: {
              id: '770e8400-e29b-41d4-a716-446655440000',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            },
            createdAt: '2025-02-01T10:00:00.000Z',
            updatedAt: '2025-02-01T10:00:00.000Z',
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
    @Query() query: FilesQueryDto,
  ) {
    return this.filesService.findAll(accountId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file by ID',
    description: 'Get file metadata and download URL by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        fileName: 'invoice-receipt.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
        entityType: 'invoice',
        entityId: '660e8400-e29b-41d4-a716-446655440000',
        description: 'Invoice payment receipt',
        downloadUrl:
          'https://bucket.s3.amazonaws.com/accounts/123/files/550e8400-e29b-41d4-a716-446655440000.pdf?...',
        uploadedBy: {
          id: '770e8400-e29b-41d4-a716-446655440000',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        createdAt: '2025-02-01T10:00:00.000Z',
        updatedAt: '2025-02-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async findById(
    @Param('id') fileId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.filesService.findById(fileId, accountId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete file',
    description: 'Delete a file from S3 and database (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        message: 'File deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async delete(
    @Param('id') fileId: string,
    @CurrentUser('accountId') accountId: string,
  ) {
    return this.filesService.delete(fileId, accountId);
  }
}
