import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Stripe integration will not work.');
    }

    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    paymentMethodId?: string,
    customerId?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: metadata || {},
      };

      if (customerId) {
        params.customer = customerId;
      }

      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
        params.confirm = true;
        params.automatic_payment_methods = { enabled: false };
      } else {
        params.automatic_payment_methods = { enabled: true };
      }

      const paymentIntent = await this.stripe.paymentIntents.create(params);

      this.logger.log(`Payment intent created: ${paymentIntent.id} for amount ${amount}`);

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPaymentIntent(intentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(intentId);

      this.logger.log(`Payment intent confirmed: ${intentId}`);

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  async retrievePaymentIntent(intentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(intentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve payment: ${error.message}`);
    }
  }

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      this.logger.log(`Stripe customer created: ${customer.id} for ${email}`);

      return customer;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to retrieve customer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve customer: ${error.message}`);
    }
  }

  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, params);

      this.logger.log(`Stripe customer updated: ${customerId}`);

      return customer;
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update customer: ${error.message}`);
    }
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      this.logger.log(`Payment method ${paymentMethodId} attached to customer ${customerId}`);

      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to attach payment method: ${error.message}`);
    }
  }

  async listPaymentMethods(
    customerId: string,
    type: string = 'card',
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as any,
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to list payment methods: ${error.message}`);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      this.logger.log(`Payment method detached: ${paymentMethodId}`);

      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to detach payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to detach payment method: ${error.message}`);
    }
  }

  async createRefund(
    chargeId: string,
    amount?: number,
    reason?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Refund> {
    try {
      const params: Stripe.RefundCreateParams = {
        charge: chargeId,
        metadata: metadata || {},
      };

      if (amount) {
        params.amount = Math.round(amount * 100);
      }

      if (reason) {
        params.reason = reason as any;
      }

      const refund = await this.stripe.refunds.create(params);

      this.logger.log(`Refund created: ${refund.id} for charge ${chargeId}`);

      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create refund: ${error.message}`);
    }
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      this.logger.log(`Setup intent created: ${setupIntent.id} for customer ${customerId}`);

      return setupIntent;
    } catch (error) {
      this.logger.error(`Failed to create setup intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create setup intent: ${error.message}`);
    }
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

      if (!webhookSecret) {
        this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
        throw new InternalServerErrorException('Webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      return event;
    } catch (error) {
      this.logger.error(`Failed to construct webhook event: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<any> {
    try {
      const event = await this.constructWebhookEvent(payload, signature);

      this.logger.log(`Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);

        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

        case 'charge.refunded':
          return this.handleChargeRefunded(event.data.object as Stripe.Charge);

        case 'customer.created':
          return this.handleCustomerCreated(event.data.object as Stripe.Customer);

        case 'payment_method.attached':
          return this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
          return { received: true, type: event.type };
      }
    } catch (error) {
      this.logger.error(`Webhook handler error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    return { type: 'payment_intent.succeeded', paymentIntent };
  }

  private handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.warn(`Payment failed: ${paymentIntent.id}`);
    return { type: 'payment_intent.payment_failed', paymentIntent };
  }

  private handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);
    return { type: 'charge.refunded', charge };
  }

  private handleCustomerCreated(customer: Stripe.Customer) {
    this.logger.log(`Customer created: ${customer.id}`);
    return { type: 'customer.created', customer };
  }

  private handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
    return { type: 'payment_method.attached', paymentMethod };
  }
}
