# Deployment & DevOps

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main, staging, develop]

env:
  NODE_VERSION: '18.x'
  GO_VERSION: '1.21'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t app:${{ github.sha }} .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin
          docker push app:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/app app=app:${{ github.sha }}
          kubectl rollout status deployment/app

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/app app=app:${{ github.sha }}
          kubectl rollout status deployment/app
```

---

## 2. Docker Configuration

### Backend Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/jobber
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: jobber
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/jobber
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
```

---

## 3. Kubernetes Deployment

### Deployment Configuration

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: jobber
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: your-registry/api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: redis-config
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api-server
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 4. Infrastructure as Code (Terraform)

### AWS Infrastructure

```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "jobber-vpc"
  }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  identifier           = "jobber-db"
  engine               = "postgres"
  engine_version       = "14.7"
  instance_class       = "db.r5.xlarge"
  allocated_storage    = 500
  storage_encrypted    = true

  db_name  = "jobber"
  username = "admin"
  password = var.db_password

  multi_az               = true
  backup_retention_period = 30

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "jobber-redis"
  engine               = "redis"
  node_type            = "cache.r5.large"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# S3 Bucket
resource "aws_s3_bucket" "uploads" {
  bucket = "jobber-uploads"

  tags = {
    Name = "Jobber Uploads"
  }
}

resource "aws_s3_bucket_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "jobber-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "jobber-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

---

## 5. Environment Configuration

### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/jobber_dev
REDIS_URL=redis://localhost:6379
API_URL=http://localhost:8080
LOG_LEVEL=debug
```

### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db.example.com:5432/jobber
REDIS_URL=redis://staging-redis.example.com:6379
API_URL=https://api-staging.jobber-clone.com
LOG_LEVEL=info
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.example.com:5432/jobber
REDIS_URL=redis://prod-redis.example.com:6379
API_URL=https://api.jobber-clone.com
LOG_LEVEL=error
```

---

## 6. Database Migrations

### Migration Tool: node-pg-migrate or Flyway

```sql
-- migrations/001_initial_schema.sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);
```

### Migration Script
```bash
#!/bin/bash
# scripts/migrate.sh

echo "Running database migrations..."

npm run migrate up

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed"
  exit 1
fi
```

---

## 7. Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-server'
    static_configs:
      - targets: ['api-server:8080']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Grafana Dashboards
- API Performance (RPS, latency, errors)
- Database Metrics (connections, query time)
- System Resources (CPU, memory, disk)
- Business Metrics (jobs completed, revenue)

---

## 8. Logging Stack

### Fluentd Configuration

```xml
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/td-agent/app.log.pos
  tag app.logs
  <parse>
    @type json
  </parse>
</source>

<match app.logs>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix app-logs
</match>
```

---

## 9. Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_FILE="backup-$DATE.sql"

# Dump database
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_FILE

# Encrypt
gpg --encrypt --recipient admin@example.com $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gpg s3://jobber-backups/databases/

# Cleanup
rm $BACKUP_FILE $BACKUP_FILE.gpg

echo "Backup completed: $BACKUP_FILE.gpg"
```

### Restore Procedure

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

# Download from S3
aws s3 cp s3://jobber-backups/databases/$BACKUP_FILE .

# Decrypt
gpg --decrypt $BACKUP_FILE > backup.sql

# Restore
psql -h $DB_HOST -U $DB_USER $DB_NAME < backup.sql

echo "Restore completed"
```

---

## 10. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup created
- [ ] Team notified

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor logs and metrics
- [ ] Verify database migrations
- [ ] Test critical paths
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify all services running
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Test key functionality
- [ ] Update documentation
- [ ] Notify team of completion

### Rollback Plan
- [ ] Keep previous version tagged
- [ ] Database rollback scripts ready
- [ ] Rollback procedure documented
- [ ] Team knows how to execute rollback

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
