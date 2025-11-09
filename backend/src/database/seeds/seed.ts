import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Account } from '../entities/account.entity';
import { User } from '../entities/user.entity';
import { Client } from '../entities/client.entity';
import { ClientContact } from '../entities/client-contact.entity';
import { ClientAddress } from '../entities/client-address.entity';
import { Quote } from '../entities/quote.entity';
import { QuoteLineItem } from '../entities/quote-line-item.entity';
import { Job } from '../entities/job.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceLineItem } from '../entities/invoice-line-item.entity';
import { Payment } from '../entities/payment.entity';
import { Sequence } from '../entities/sequence.entity';
import dataSource from '../../../ormconfig';

async function seed() {
  let connection: DataSource;

  try {
    connection = await dataSource.initialize();
    console.log('Database connection established');

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const accountRepo = connection.getRepository(Account);
      const userRepo = connection.getRepository(User);
      const clientRepo = connection.getRepository(Client);
      const clientContactRepo = connection.getRepository(ClientContact);
      const clientAddressRepo = connection.getRepository(ClientAddress);
      const quoteRepo = connection.getRepository(Quote);
      const quoteLineItemRepo = connection.getRepository(QuoteLineItem);
      const jobRepo = connection.getRepository(Job);
      const invoiceRepo = connection.getRepository(Invoice);
      const invoiceLineItemRepo = connection.getRepository(InvoiceLineItem);
      const paymentRepo = connection.getRepository(Payment);
      const sequenceRepo = connection.getRepository(Sequence);

      const existingAccount = await accountRepo.findOne({
        where: { email: 'demo@jobber-clone.com' },
      });

      if (existingAccount) {
        console.log('Seed data already exists. Skipping...');
        await queryRunner.rollbackTransaction();
        return;
      }

      console.log('Creating demo account...');
      const account = accountRepo.create({
        name: 'Demo Field Services',
        companyName: 'Demo Field Services LLC',
        email: 'demo@jobber-clone.com',
        phone: '+1234567890',
        subscriptionPlan: 'grow',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
      });
      await queryRunner.manager.save(account);

      console.log('Creating users...');
      const passwordHash = await bcrypt.hash('password123', 10);

      const owner = userRepo.create({
        accountId: account.id,
        email: 'admin@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Owner',
        phone: '+1234567890',
        role: 'owner',
        permissions: ['all'],
        status: 'active',
      });
      await queryRunner.manager.save(owner);

      const manager = userRepo.create({
        accountId: account.id,
        email: 'manager@example.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Manager',
        phone: '+1234567891',
        role: 'admin',
        permissions: ['manage_clients', 'manage_jobs', 'manage_quotes', 'manage_invoices'],
        status: 'active',
      });
      await queryRunner.manager.save(manager);

      const worker = userRepo.create({
        accountId: account.id,
        email: 'worker@example.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Worker',
        phone: '+1234567892',
        role: 'worker',
        permissions: ['view_jobs', 'update_jobs'],
        status: 'active',
      });
      await queryRunner.manager.save(worker);

      console.log('Creating sequences...');
      await queryRunner.manager.save(
        sequenceRepo.create([
          { accountId: account.id, sequenceType: 'quote', prefix: 'QT', currentValue: 0 },
          { accountId: account.id, sequenceType: 'job', prefix: 'JOB', currentValue: 0 },
          { accountId: account.id, sequenceType: 'invoice', prefix: 'INV', currentValue: 0 },
          { accountId: account.id, sequenceType: 'payment', prefix: 'PAY', currentValue: 0 },
        ]),
      );

      console.log('Creating clients...');
      const client1 = clientRepo.create({
        accountId: account.id,
        firstName: 'Robert',
        lastName: 'Johnson',
        companyName: 'Johnson Residence',
        email: 'robert.johnson@email.com',
        phone: '+1555111001',
        tags: ['residential', 'recurring'],
        status: 'active',
        clientType: 'residential',
        paymentTerms: 30,
        createdBy: owner.id,
      });
      await queryRunner.manager.save(client1);

      const client1Contact = clientContactRepo.create({
        clientId: client1.id,
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@email.com',
        phone: '+1555111001',
        isPrimary: true,
      });
      await queryRunner.manager.save(client1Contact);

      const client1Address = clientAddressRepo.create({
        clientId: client1.id,
        addressType: 'service',
        label: 'Home',
        street1: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US',
        latitude: 39.7817,
        longitude: -89.6501,
        isPrimary: true,
      });
      await queryRunner.manager.save(client1Address);

      const client2 = clientRepo.create({
        accountId: account.id,
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@email.com',
        phone: '+1555222002',
        tags: ['residential', 'vip'],
        status: 'active',
        clientType: 'residential',
        paymentTerms: 15,
        createdBy: owner.id,
      });
      await queryRunner.manager.save(client2);

      const client2Address = clientAddressRepo.create({
        clientId: client2.id,
        addressType: 'service',
        street1: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        country: 'US',
        isPrimary: true,
      });
      await queryRunner.manager.save(client2Address);

      const client3 = clientRepo.create({
        accountId: account.id,
        companyName: 'ABC Corporation',
        email: 'contact@abc-corp.com',
        phone: '+1555333003',
        tags: ['commercial', 'large-account'],
        status: 'active',
        clientType: 'commercial',
        paymentTerms: 45,
        creditLimit: 50000,
        createdBy: manager.id,
      });
      await queryRunner.manager.save(client3);

      const client3Address = clientAddressRepo.create({
        clientId: client3.id,
        addressType: 'service',
        label: 'Corporate Office',
        street1: '789 Business Park Drive',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62703',
        country: 'US',
        isPrimary: true,
      });
      await queryRunner.manager.save(client3Address);

      const client4 = clientRepo.create({
        accountId: account.id,
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@email.com',
        phone: '+1555444004',
        tags: ['residential'],
        status: 'active',
        clientType: 'residential',
        paymentTerms: 30,
        createdBy: owner.id,
      });
      await queryRunner.manager.save(client4);

      const client4Address = clientAddressRepo.create({
        clientId: client4.id,
        addressType: 'service',
        street1: '321 Elm Street',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        country: 'US',
        isPrimary: true,
      });
      await queryRunner.manager.save(client4Address);

      const client5 = clientRepo.create({
        accountId: account.id,
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@email.com',
        phone: '+1555555005',
        tags: ['residential', 'new'],
        status: 'active',
        clientType: 'residential',
        paymentTerms: 30,
        createdBy: manager.id,
      });
      await queryRunner.manager.save(client5);

      const client5Address = clientAddressRepo.create({
        clientId: client5.id,
        addressType: 'service',
        street1: '654 Pine Road',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62705',
        country: 'US',
        isPrimary: true,
      });
      await queryRunner.manager.save(client5Address);

      console.log('Creating quotes...');
      const quote1 = quoteRepo.create({
        accountId: account.id,
        clientId: client1.id,
        addressId: client1Address.id,
        quoteNumber: 'QT-1001',
        title: 'Lawn Care Service - Spring Package',
        description: 'Complete lawn care service including mowing, edging, and fertilization',
        status: 'approved',
        subtotal: 450,
        taxRate: 0.08,
        taxAmount: 36,
        total: 486,
        quoteDate: new Date('2024-03-15'),
        expiryDate: new Date('2024-04-15'),
        approvedAt: new Date('2024-03-20'),
        createdBy: owner.id,
      });
      await queryRunner.manager.save(quote1);

      await queryRunner.manager.save(
        quoteLineItemRepo.create([
          {
            quoteId: quote1.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'Weekly Lawn Mowing',
            description: '4 visits per month',
            quantity: 4,
            unitPrice: 75,
            totalPrice: 300,
            isTaxable: true,
          },
          {
            quoteId: quote1.id,
            sortOrder: 2,
            itemType: 'service',
            name: 'Spring Fertilization',
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
            isTaxable: true,
          },
        ]),
      );

      const quote2 = quoteRepo.create({
        accountId: account.id,
        clientId: client3.id,
        addressId: client3Address.id,
        quoteNumber: 'QT-1002',
        title: 'Commercial HVAC Maintenance Contract',
        description: 'Annual HVAC maintenance and inspection',
        status: 'sent',
        subtotal: 2500,
        taxRate: 0.08,
        taxAmount: 200,
        total: 2700,
        quoteDate: new Date('2024-03-18'),
        expiryDate: new Date('2024-04-18'),
        createdBy: manager.id,
      });
      await queryRunner.manager.save(quote2);

      await queryRunner.manager.save(
        quoteLineItemRepo.create([
          {
            quoteId: quote2.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'Quarterly HVAC Inspection',
            description: '4 inspections per year',
            quantity: 4,
            unitPrice: 500,
            totalPrice: 2000,
            isTaxable: true,
          },
          {
            quoteId: quote2.id,
            sortOrder: 2,
            itemType: 'service',
            name: 'Filter Replacement',
            description: 'Premium filters',
            quantity: 4,
            unitPrice: 125,
            totalPrice: 500,
            isTaxable: true,
          },
        ]),
      );

      const quote3 = quoteRepo.create({
        accountId: account.id,
        clientId: client2.id,
        addressId: client2Address.id,
        quoteNumber: 'QT-1003',
        title: 'Pool Cleaning Service',
        description: 'Weekly pool cleaning and chemical balancing',
        status: 'draft',
        subtotal: 600,
        taxRate: 0.08,
        taxAmount: 48,
        total: 648,
        quoteDate: new Date('2024-03-22'),
        expiryDate: new Date('2024-04-22'),
        createdBy: owner.id,
      });
      await queryRunner.manager.save(quote3);

      await queryRunner.manager.save(
        quoteLineItemRepo.create([
          {
            quoteId: quote3.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'Weekly Pool Service',
            description: 'Cleaning and chemical maintenance',
            quantity: 4,
            unitPrice: 150,
            totalPrice: 600,
            isTaxable: true,
          },
        ]),
      );

      console.log('Creating jobs...');
      const job1 = jobRepo.create({
        accountId: account.id,
        clientId: client1.id,
        addressId: client1Address.id,
        quoteId: quote1.id,
        jobNumber: 'JOB-2001',
        title: 'Lawn Care - Week 1',
        description: 'Weekly lawn maintenance',
        status: 'completed',
        priority: 'normal',
        scheduledStart: new Date('2024-03-25T09:00:00'),
        scheduledEnd: new Date('2024-03-25T11:00:00'),
        actualStart: new Date('2024-03-25T09:15:00'),
        actualEnd: new Date('2024-03-25T10:45:00'),
        assignedTo: [worker.id],
        estimatedValue: 75,
        completionNotes: 'Job completed successfully. Customer satisfied.',
        createdBy: owner.id,
      });
      await queryRunner.manager.save(job1);

      const job2 = jobRepo.create({
        accountId: account.id,
        clientId: client1.id,
        addressId: client1Address.id,
        quoteId: quote1.id,
        jobNumber: 'JOB-2002',
        title: 'Lawn Care - Week 2',
        description: 'Weekly lawn maintenance',
        status: 'in_progress',
        priority: 'normal',
        scheduledStart: new Date('2024-04-01T09:00:00'),
        scheduledEnd: new Date('2024-04-01T11:00:00'),
        actualStart: new Date('2024-04-01T09:10:00'),
        assignedTo: [worker.id],
        estimatedValue: 75,
        createdBy: owner.id,
      });
      await queryRunner.manager.save(job2);

      const job3 = jobRepo.create({
        accountId: account.id,
        clientId: client4.id,
        addressId: client4Address.id,
        jobNumber: 'JOB-2003',
        title: 'Plumbing Repair - Leaky Faucet',
        description: 'Fix kitchen faucet leak',
        status: 'scheduled',
        priority: 'high',
        scheduledStart: new Date('2024-04-05T14:00:00'),
        scheduledEnd: new Date('2024-04-05T16:00:00'),
        assignedTo: [worker.id],
        estimatedValue: 150,
        clientInstructions: 'Please call 30 minutes before arrival',
        createdBy: manager.id,
      });
      await queryRunner.manager.save(job3);

      const job4 = jobRepo.create({
        accountId: account.id,
        clientId: client3.id,
        addressId: client3Address.id,
        jobNumber: 'JOB-2004',
        title: 'HVAC Inspection - Q1',
        description: 'Quarterly HVAC system inspection',
        status: 'completed',
        priority: 'normal',
        scheduledStart: new Date('2024-03-28T10:00:00'),
        scheduledEnd: new Date('2024-03-28T14:00:00'),
        actualStart: new Date('2024-03-28T10:00:00'),
        actualEnd: new Date('2024-03-28T13:30:00'),
        assignedTo: [worker.id, manager.id],
        estimatedValue: 500,
        completionNotes: 'System is in good condition. Replaced air filters.',
        createdBy: manager.id,
      });
      await queryRunner.manager.save(job4);

      console.log('Creating invoices...');
      const invoice1 = invoiceRepo.create({
        accountId: account.id,
        clientId: client1.id,
        jobId: job1.id,
        quoteId: quote1.id,
        invoiceNumber: 'INV-3001',
        title: 'Lawn Care Service - March',
        description: 'Lawn care service for the month of March',
        status: 'paid',
        subtotal: 75,
        taxRate: 0.08,
        taxAmount: 6,
        total: 81,
        amountPaid: 81,
        balanceDue: 0,
        invoiceDate: new Date('2024-03-26'),
        dueDate: new Date('2024-04-25'),
        paidDate: new Date('2024-03-28'),
        paymentTerms: 30,
        createdBy: owner.id,
      });
      await queryRunner.manager.save(invoice1);

      await queryRunner.manager.save(
        invoiceLineItemRepo.create([
          {
            invoiceId: invoice1.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'Lawn Mowing and Maintenance',
            description: 'Week 1 service',
            quantity: 1,
            unitPrice: 75,
            totalPrice: 75,
            isTaxable: true,
          },
        ]),
      );

      const invoice2 = invoiceRepo.create({
        accountId: account.id,
        clientId: client3.id,
        jobId: job4.id,
        invoiceNumber: 'INV-3002',
        title: 'HVAC Inspection - Q1 2024',
        description: 'Quarterly HVAC inspection and filter replacement',
        status: 'sent',
        subtotal: 625,
        taxRate: 0.08,
        taxAmount: 50,
        total: 675,
        amountPaid: 0,
        balanceDue: 675,
        invoiceDate: new Date('2024-03-29'),
        dueDate: new Date('2024-05-13'),
        paymentTerms: 45,
        sentAt: new Date('2024-03-29T10:00:00'),
        createdBy: manager.id,
      });
      await queryRunner.manager.save(invoice2);

      await queryRunner.manager.save(
        invoiceLineItemRepo.create([
          {
            invoiceId: invoice2.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'HVAC Inspection',
            description: 'Comprehensive system inspection',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            isTaxable: true,
          },
          {
            invoiceId: invoice2.id,
            sortOrder: 2,
            itemType: 'product',
            name: 'Premium Air Filters',
            quantity: 1,
            unitPrice: 125,
            totalPrice: 125,
            isTaxable: true,
          },
        ]),
      );

      const invoice3 = invoiceRepo.create({
        accountId: account.id,
        clientId: client2.id,
        invoiceNumber: 'INV-3003',
        title: 'Garden Maintenance - March',
        description: 'Monthly garden maintenance service',
        status: 'overdue',
        subtotal: 200,
        taxRate: 0.08,
        taxAmount: 16,
        total: 216,
        amountPaid: 0,
        balanceDue: 216,
        invoiceDate: new Date('2024-03-10'),
        dueDate: new Date('2024-03-25'),
        paymentTerms: 15,
        sentAt: new Date('2024-03-10T09:00:00'),
        reminderCount: 2,
        lastReminderSentAt: new Date('2024-03-30T10:00:00'),
        createdBy: owner.id,
      });
      await queryRunner.manager.save(invoice3);

      await queryRunner.manager.save(
        invoiceLineItemRepo.create([
          {
            invoiceId: invoice3.id,
            sortOrder: 1,
            itemType: 'service',
            name: 'Garden Maintenance',
            description: 'Pruning, weeding, and cleanup',
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200,
            isTaxable: true,
          },
        ]),
      );

      console.log('Creating payments...');
      const payment1 = paymentRepo.create({
        accountId: account.id,
        clientId: client1.id,
        invoiceId: invoice1.id,
        paymentNumber: 'PAY-4001',
        amount: 81,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paymentProcessor: 'stripe',
        status: 'completed',
        processorPaymentId: 'ch_demo123456789',
        cardLast4: '4242',
        cardBrand: 'visa',
        processingFee: 2.65,
        netAmount: 78.35,
        paymentDate: new Date('2024-03-28T15:30:00'),
        settledDate: new Date('2024-03-30T00:00:00'),
        notes: 'Payment processed successfully',
        createdBy: owner.id,
      });
      await queryRunner.manager.save(payment1);

      const payment2 = paymentRepo.create({
        accountId: account.id,
        clientId: client5.id,
        paymentNumber: 'PAY-4002',
        amount: 150,
        currency: 'USD',
        paymentMethod: 'check',
        status: 'completed',
        paymentDate: new Date('2024-03-29T00:00:00'),
        notes: 'Check #1234',
        createdBy: manager.id,
      });
      await queryRunner.manager.save(payment2);

      await queryRunner.commitTransaction();
      console.log('Seed data created successfully!');
      console.log('\n===========================================');
      console.log('Demo Account Created:');
      console.log('===========================================');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
      console.log('\nOther Users:');
      console.log('- manager@example.com (password123)');
      console.log('- worker@example.com (password123)');
      console.log('===========================================\n');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
    }
  }
}

seed()
  .then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
