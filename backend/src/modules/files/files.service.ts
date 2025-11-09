import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FileMetadata } from '../../database/entities/file-metadata.entity';
import { AwsS3Service } from '../../integrations/aws-s3/aws-s3.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { FilesQueryDto } from './dto/files-query.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileMetadata)
    private readonly fileMetadataRepository: Repository<FileMetadata>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  /**
   * Generate a presigned URL for uploading a file
   */
  async generateUploadUrl(accountId: string, userId: string, dto: GenerateUploadUrlDto) {
    try {
      const fileId = uuidv4();
      const fileExtension = this.getFileExtension(dto.fileName);
      const sanitizedFileName = this.sanitizeFileName(dto.fileName);

      // Generate S3 key with accountId namespace
      const key = `accounts/${accountId}/files/${fileId}${fileExtension}`;

      // Generate presigned URL (valid for 5 minutes)
      const uploadUrl = await this.awsS3Service.generatePresignedUrl(
        key,
        dto.fileType,
        300,
      );

      // Create file metadata record in pending state
      const fileMetadata = this.fileMetadataRepository.create({
        id: fileId,
        accountId,
        key,
        fileName: sanitizedFileName,
        mimeType: dto.fileType,
        fileSize: 0, // Will be updated on confirm
        entityType: dto.entityType || 'general',
        entityId: dto.entityId,
        uploadedBy: userId,
        description: dto.description,
        metadata: {
          status: 'pending',
          uploadInitiatedAt: new Date().toISOString(),
        },
      });

      await this.fileMetadataRepository.save(fileMetadata);

      this.logger.log(`Generated upload URL for file: ${fileId}, key: ${key}`);

      return {
        fileId,
        uploadUrl,
        key,
        expiresIn: 300,
      };
    } catch (error) {
      this.logger.error('Failed to generate upload URL:', error);
      throw error;
    }
  }

  /**
   * Confirm file upload and update metadata
   */
  async confirmUpload(accountId: string, fileId: string, dto: ConfirmUploadDto) {
    const file = await this.fileMetadataRepository.findOne({
      where: { id: fileId, accountId },
    });

    if (!file) {
      throw new NotFoundException('File record not found');
    }

    if (file.metadata?.status === 'confirmed') {
      throw new BadRequestException('File upload already confirmed');
    }

    // Update file metadata
    file.fileName = dto.fileName;
    file.fileSize = dto.fileSize;
    file.mimeType = dto.mimeType;
    file.metadata = {
      ...file.metadata,
      status: 'confirmed',
      uploadCompletedAt: new Date().toISOString(),
    };

    await this.fileMetadataRepository.save(file);

    this.logger.log(`File upload confirmed: ${fileId}`);

    return this.mapFileToResponse(file, await this.awsS3Service.getFileUrl(file.key));
  }

  /**
   * Get file by ID with download URL
   */
  async findById(fileId: string, accountId: string) {
    const file = await this.fileMetadataRepository.findOne({
      where: { id: fileId, accountId },
      relations: ['uploader'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const downloadUrl = await this.awsS3Service.getFileUrl(file.key);

    return this.mapFileToResponse(file, downloadUrl);
  }

  /**
   * Delete file from S3 and database (soft delete)
   */
  async delete(fileId: string, accountId: string) {
    const file = await this.fileMetadataRepository.findOne({
      where: { id: fileId, accountId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from S3
    try {
      await this.awsS3Service.deleteFile(file.key);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${file.key}`, error);
      // Continue with soft delete even if S3 deletion fails
    }

    // Soft delete from database
    await this.fileMetadataRepository.softDelete(fileId);

    this.logger.log(`File deleted: ${fileId}`);

    return {
      message: 'File deleted successfully',
      id: fileId,
    };
  }

  /**
   * List files with pagination and filters
   */
  async findAll(accountId: string, query: FilesQueryDto) {
    const { page = 1, limit = 50, entityType, entityId, mimeType } = query;

    const queryBuilder = this.fileMetadataRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploader', 'uploader')
      .where('file.accountId = :accountId', { accountId })
      .andWhere('file.deletedAt IS NULL');

    if (entityType) {
      queryBuilder.andWhere('file.entityType = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('file.entityId = :entityId', { entityId });
    }

    if (mimeType) {
      queryBuilder.andWhere('file.mimeType LIKE :mimeType', {
        mimeType: `%${mimeType}%`,
      });
    }

    const [files, total] = await queryBuilder
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Generate download URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const downloadUrl = await this.awsS3Service.getFileUrl(file.key);
        return this.mapFileToResponse(file, downloadUrl);
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: filesWithUrls,
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

  /**
   * Map file entity to response format
   */
  private mapFileToResponse(file: FileMetadata, downloadUrl: string) {
    return {
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      entityType: file.entityType,
      entityId: file.entityId,
      description: file.description,
      downloadUrl,
      uploadedBy: file.uploader
        ? {
            id: file.uploader.id,
            firstName: file.uploader.firstName,
            lastName: file.uploader.lastName,
            email: file.uploader.email,
          }
        : file.uploadedBy,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }
}
