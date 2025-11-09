import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly region: string;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.warn('AWS S3 credentials not configured. File upload features will not work.');
    }

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region: this.region,
      signatureVersion: 'v4',
    });
  }

  /**
   * Generate a presigned URL for uploading a file directly to S3
   * @param key - S3 object key (file path)
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
   * @returns Presigned URL for upload
   */
  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 300,
  ): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
      };

      const url = await this.s3.getSignedUrlPromise('putObject', params);
      this.logger.log(`Generated presigned URL for key: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for key ${key}:`, error);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Upload a file directly to S3
   * @param key - S3 object key (file path)
   * @param buffer - File buffer
   * @param contentType - MIME type of the file
   * @returns S3 upload result
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'private',
      };

      const result = await this.s3.upload(params).promise();
      this.logger.log(`File uploaded successfully to S3: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3 (key: ${key}):`, error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Get a presigned URL for downloading/viewing a file
   * @param key - S3 object key (file path)
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Presigned URL for download
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      this.logger.log(`Generated download URL for key: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate download URL for key ${key}:`, error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (file path)
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3 (key: ${key}):`, error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - S3 object key (file path)
   * @returns true if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({ Bucket: this.bucket, Key: key }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      this.logger.error(`Failed to check file existence (key: ${key}):`, error);
      throw new InternalServerErrorException('Failed to check file existence');
    }
  }

  /**
   * Get file metadata
   * @param key - S3 object key (file path)
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      const metadata = await this.s3.headObject(params).promise();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get file metadata (key: ${key}):`, error);
      throw new InternalServerErrorException('Failed to get file metadata');
    }
  }
}
