import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Client form validation
export const clientFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  status: z.enum(['active', 'inactive']),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Quote form validation
export const quoteFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  title: z.string().min(1, 'Title is required'),
  lineItems: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        description: z.string().optional(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Price must be positive'),
      })
    )
    .min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
  expiryDate: z.string().optional(),
});

// Job form validation
export const jobFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  quoteId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, 'At least one team member is required'),
  notes: z.string().optional(),
});

// Invoice form validation
export const invoiceFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  jobId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        description: z.string().optional(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Price must be positive'),
      })
    )
    .min(1, 'At least one line item is required'),
  taxRate: z.number().min(0).max(1),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema,
  companyName: z.string().min(1, 'Company name is required'),
});
