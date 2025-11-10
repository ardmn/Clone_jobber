#!/bin/bash

# Fix clients.api.ts
sed -i 's/^import {$/import type {/' src/services/api/clients.api.ts

# Fix quotes.api.ts
sed -i 's/^import {$/import type {/' src/services/api/quotes.api.ts
sed -i '/ApiResponse,/d' src/services/api/quotes.api.ts

# Fix jobs.api.ts
sed -i 's/^import {$/import type {/' src/services/api/jobs.api.ts

# Fix invoices.api.ts
sed -i 's/^import {$/import type {/' src/services/api/invoices.api.ts

# Fix auth.service.ts
sed -i 's/^import {$/import type {/' src/services/auth/auth.service.ts

# Fix useAuthStore.ts
sed -i 's/^import { User } from/import type { User } from/' src/store/useAuthStore.ts

# Fix index.ts
sed -i 's/^import {$/import type {/' src/services/api/index.ts

echo "Fixed all type imports"
