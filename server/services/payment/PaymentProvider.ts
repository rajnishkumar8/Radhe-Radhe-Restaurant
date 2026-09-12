export interface PaymentIntent {
  provider: "direct_upi" | "razorpay" | "cash_on_delivery" | "pay_at_pickup";
  intentUrl?: string; // upi://pay?pa=...
  qrPayload?: string; // Payload string for QR code generation
  amount: string; // Authoritative formatted amount, e.g. "420.00"
  currency: "INR";
  orderReference: string;
  upiId?: string;
  payeeName?: string;
}

export interface PaymentClaim {
  orderId: number;
  method: string;
  upiReference?: string;
  proofImageUrl?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: "payment_verified" | "payment_rejected" | "payment_pending_verification";
  transactionId?: string;
  verifiedAt?: Date;
  verifiedBy?: number;
  rejectionReason?: string;
}

export interface IPaymentProvider {
  name: string;
  generateIntent(params: {
    orderNumber: string;
    amount: string;
    upiId: string;
    payeeName: string;
    note?: string;
  }): PaymentIntent;
}

export class DirectUPIProvider implements IPaymentProvider {
  name = "direct_upi";

  generateIntent(params: {
    orderNumber: string;
    amount: string;
    upiId: string;
    payeeName: string;
    note?: string;
  }): PaymentIntent {
    const encodedPayee = encodeURIComponent(params.payeeName);
    const encodedNote = encodeURIComponent(params.note || `Order ${params.orderNumber} - Radhe Radhe`);
    // Standard NPCI UPI URI Specification:
    // upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>&tr=<REF>
    const intentUrl = `upi://pay?pa=${params.upiId}&pn=${encodedPayee}&am=${params.amount}&cu=INR&tn=${encodedNote}&tr=${params.orderNumber}`;

    return {
      provider: "direct_upi",
      intentUrl,
      qrPayload: intentUrl,
      amount: params.amount,
      currency: "INR",
      orderReference: params.orderNumber,
      upiId: params.upiId,
      payeeName: params.payeeName,
    };
  }
}

export class RazorpayProvider implements IPaymentProvider {
  name = "razorpay";

  generateIntent(params: {
    orderNumber: string;
    amount: string;
    upiId: string;
    payeeName: string;
    note?: string;
  }): PaymentIntent {
    return {
      provider: "razorpay",
      amount: params.amount,
      currency: "INR",
      orderReference: params.orderNumber,
      intentUrl: undefined,
      qrPayload: undefined,
    };
  }
}

export const directUpiProvider = new DirectUPIProvider();
export const razorpayProvider = new RazorpayProvider();
