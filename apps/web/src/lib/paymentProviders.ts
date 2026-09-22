/**
 * Ethos AI — Payment Provider Abstraction Layer
 * Aligned with Module 5.13, ETHOS_AI_CONTEXT.md §3/§10 & Issue #10 (K-10)
 *
 * Implements pluggable gateway drivers for SSLCommerz, bKash, and Nagad
 * behind a unified PaymentProvider interface with sandbox checkout & webhook support.
 */

export type GatewayProviderId = 'SSLCOMMERZ' | 'BKASH' | 'NAGAD';

export interface PaymentInitiationParams {
  milestoneId: string;
  amountPoisha: bigint | string | number;
  currency?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  callbackUrl?: string;
}

export interface PaymentInitiationResult {
  provider: GatewayProviderId;
  providerTxnId: string;
  gatewaySessionId: string;
  checkoutUrl: string;
  amountPoisha: string;
  currency: string;
  expiresAt: string;
}

export interface VerifiedPaymentPayload {
  provider: GatewayProviderId;
  providerTxnId: string;
  milestoneId: string;
  amountPoisha: string;
  currency: string;
  status: 'VALID' | 'FAILED' | 'CANCELLED';
  paidAt: string;
  rawPayload: Record<string, any>;
}

export interface PaymentProvider {
  readonly id: GatewayProviderId;
  readonly displayName: string;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean>;
  processWebhook(payload: Record<string, any>): Promise<VerifiedPaymentPayload>;
}

/**
 * SSLCommerz Sandbox Implementation
 * Simulates SSLCommerz EasyCheckout API & IPN (Instant Payment Notification)
 */
export class SSLCommerzSandboxProvider implements PaymentProvider {
  readonly id: GatewayProviderId = 'SSLCOMMERZ';
  readonly displayName = 'SSLCommerz Gateway (Cards / NetBanking / MFS)';

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const timestamp = Date.now();
    const providerTxnId = `SSLCZ-TXN-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewaySessionId = `SSLCZ-SESSION-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      provider: this.id,
      providerTxnId,
      gatewaySessionId,
      checkoutUrl: `/checkout/sandbox?provider=sslcommerz&session=${gatewaySessionId}&txn=${providerTxnId}&mls=${params.milestoneId}`,
      amountPoisha: params.amountPoisha.toString(),
      currency: params.currency || 'BDT',
      expiresAt: new Date(timestamp + 30 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    if (!payload.tran_id && !payload.providerTxnId) return false;
    if (payload.status && payload.status !== 'VALID' && payload.status !== 'SUCCESS') return false;
    return true;
  }

  async processWebhook(payload: Record<string, any>): Promise<VerifiedPaymentPayload> {
    const txnId = payload.tran_id || payload.providerTxnId || `SSLCZ-${Date.now()}`;
    const amount = payload.amount_poisha || payload.amountPoisha || '0';
    const milestoneId = payload.value_a || payload.milestoneId || '';

    return {
      provider: this.id,
      providerTxnId: txnId,
      milestoneId,
      amountPoisha: amount.toString(),
      currency: payload.currency || 'BDT',
      status: 'VALID',
      paidAt: payload.tran_date || new Date().toISOString(),
      rawPayload: payload,
    };
  }
}

/**
 * bKash Sandbox Implementation
 * Simulates bKash Tokenized Checkout (Execute Payment & Webhook callback)
 */
export class BkashSandboxProvider implements PaymentProvider {
  readonly id: GatewayProviderId = 'BKASH';
  readonly displayName = 'bKash Merchant Checkout (017... / 018...)';

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const timestamp = Date.now();
    const providerTxnId = `BKASH-TXN-${timestamp}-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentID = `TR0011${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      provider: this.id,
      providerTxnId,
      gatewaySessionId: paymentID,
      checkoutUrl: `/checkout/sandbox?provider=bkash&session=${paymentID}&txn=${providerTxnId}&mls=${params.milestoneId}`,
      amountPoisha: params.amountPoisha.toString(),
      currency: 'BDT',
      expiresAt: new Date(timestamp + 20 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhook(payload: Record<string, any>): Promise<boolean> {
    if (!payload.paymentID && !payload.providerTxnId) return false;
    return true;
  }

  async processWebhook(payload: Record<string, any>): Promise<VerifiedPaymentPayload> {
    const txnId = payload.trxID || payload.providerTxnId || `BKASH-${Date.now()}`;
    const amount = payload.amountPoisha || payload.amount_poisha || '0';
    const milestoneId = payload.merchantInvoiceNumber || payload.milestoneId || '';

    return {
      provider: this.id,
      providerTxnId: txnId,
      milestoneId,
      amountPoisha: amount.toString(),
      currency: 'BDT',
      status: 'VALID',
      paidAt: payload.paymentExecuteTime || new Date().toISOString(),
      rawPayload: payload,
    };
  }
}

/**
 * Nagad Sandbox Implementation
 * Simulates Nagad PGW verification & instant IPN
 */
export class NagadSandboxProvider implements PaymentProvider {
  readonly id: GatewayProviderId = 'NAGAD';
  readonly displayName = 'Nagad Digital Payment';

  async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const timestamp = Date.now();
    const providerTxnId = `NAGAD-TXN-${timestamp}-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentRefId = `NGD${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      provider: this.id,
      providerTxnId,
      gatewaySessionId: paymentRefId,
      checkoutUrl: `/checkout/sandbox?provider=nagad&session=${paymentRefId}&txn=${providerTxnId}&mls=${params.milestoneId}`,
      amountPoisha: params.amountPoisha.toString(),
      currency: 'BDT',
      expiresAt: new Date(timestamp + 20 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhook(payload: Record<string, any>): Promise<boolean> {
    if (!payload.payment_ref_id && !payload.providerTxnId) return false;
    return true;
  }

  async processWebhook(payload: Record<string, any>): Promise<VerifiedPaymentPayload> {
    const txnId = payload.issuer_payment_ref || payload.providerTxnId || `NAGAD-${Date.now()}`;
    const amount = payload.amount_poisha || payload.amountPoisha || '0';
    const milestoneId = payload.order_id || payload.milestoneId || '';

    return {
      provider: this.id,
      providerTxnId: txnId,
      milestoneId,
      amountPoisha: amount.toString(),
      currency: 'BDT',
      status: 'VALID',
      paidAt: payload.payment_dt || new Date().toISOString(),
      rawPayload: payload,
    };
  }
}

/**
 * Gateway Registry providing factory access
 */
export class PaymentProviderRegistry {
  private static providers: Map<GatewayProviderId, PaymentProvider> = new Map<GatewayProviderId, PaymentProvider>([
    ['SSLCOMMERZ', new SSLCommerzSandboxProvider() as PaymentProvider],
    ['BKASH', new BkashSandboxProvider() as PaymentProvider],
    ['NAGAD', new NagadSandboxProvider() as PaymentProvider],
  ]);

  static get(providerId: string): PaymentProvider {
    const normalized = providerId.toUpperCase() as GatewayProviderId;
    const provider = this.providers.get(normalized);
    if (!provider) {
      throw new Error(`Unsupported payment provider '${providerId}'. Supported: SSLCOMMERZ, BKASH, NAGAD`);
    }
    return provider;
  }

  static getAll(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }
}
