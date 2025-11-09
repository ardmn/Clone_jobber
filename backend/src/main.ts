import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get('FRONTEND_URL') || '*',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Jobber Clone API')
    .setDescription('Field Service Management Platform API Documentation')
    .setVersion('1.0')
    .addTag('Authentication', 'Authentication and authorization endpoints')
    .addTag('Accounts', 'Account management')
    .addTag('Users', 'User and team member management')
    .addTag('Clients', 'Client and customer management')
    .addTag('Quotes', 'Quote and estimate management')
    .addTag('Jobs', 'Job and service management')
    .addTag('Invoices', 'Invoice management')
    .addTag('Payments', 'Payment processing')
    .addTag('Schedule', 'Scheduling and calendar')
    .addTag('Time Tracking', 'Time entry and timesheet management')
    .addTag('Communications', 'Email and SMS communications')
    .addTag('Files', 'File upload and management')
    .addTag('Reports', 'Reporting and analytics')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 8080;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
}

bootstrap();
