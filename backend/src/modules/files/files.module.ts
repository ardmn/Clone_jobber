import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileMetadata } from '../../database/entities/file-metadata.entity';
import { AwsS3Module } from '../../integrations/aws-s3/aws-s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([FileMetadata]), AwsS3Module],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
