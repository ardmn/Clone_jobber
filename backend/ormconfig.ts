import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'jobber',
  password: process.env.DB_PASSWORD || 'jobber123',
  database: process.env.DB_DATABASE || 'jobber_clone',
  entities: ['src/database/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  migrationsTableName: 'migrations',
  migrationsRun: false,
});
