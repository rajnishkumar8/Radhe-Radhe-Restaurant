import { useState } from "react";
import { useRoute, Link } from "wouter";
import { CheckCircle2, QrCode, Copy, Check, ArrowRight, Clock, ShieldAlert, Bike, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = Number(params?.id || 0);

  const { data: order, refetch: refetchOrder } = trpc.customer.getOrder.useQuery(
    { orderId },
    { enabled: Boolean(orderId), refetchInterval: 5000 }
  );
  const { data: settings } = trpc.restaurant.publicSettings.useQuery();

  const { data: upiIntent } = trpc.payment.getUpiIntent.useQuery(
    { orderId },
    { enabled: Boolean(orderId && order?.paymentMethod === "direct_upi") }
  );

  const claimMutation = trpc.payment.claimPayment.useMutation({
    onSuccess: () => refetchOrder(),
  });

  const [utrNumber, setUtrNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <p className="font-serif text-2xl">Retrieving your order details…</p>
        </div>
      </div>
    );
  }

  const handleCopyUpi = () => {
    if (upiIntent?.upiId) {
      navigator.clipboard.writeText(upiIntent.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (utrNumber.trim().length < 4) return;
    await claimMutation.mutateAsync({
      orderId,
      upiReference: utrNumber.trim(),
    });
    setClaimSubmitted(true);
  };

  const isUpi = order.paymentMethod === "direct_upi";
  const isClaimed = order.paymentStatus === "payment_claimed" || claimSubmitted;
  const isVerified = order.paymentStatus === "payment_verified";

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-32 lg:px-10">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6a85e]/20 text-[#d6a85e] shadow-lg">
            <CheckCircle2 size={32} />
          </span>
          <p className="mt-4 text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Order Placed Successfully</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Order #{order.orderNumber}</h1>
          <p className="mt-2 text-xs text-white/60">
            Thank you, {order.customerName}. Your order is recorded in the kitchen console.
          </p>
        </div>

        {/* Direct UPI Payment Container */}
        {isUpi && !isVerified && (
          <section className="mt-10 rounded-[2.5rem] border border-[#d6a85e]/40 bg-[#211721] p-6 sm:p-8 text-center shadow-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#d6a85e]/15 px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f4d59b]">
              <QrCode size={13} /> Direct UPI Instant Payment
            </div>

            <h2 className="mt-3 font-serif text-3xl">Scan & Pay to Confirm</h2>
            <p className="mt-1 text-xs text-white/60 max-w-md mx-auto">
              Scan with GPay, PhonePe, Paytm, BHIM, or any bank UPI app. 0% gateway charges.
            </p>

            {/* Authoritative Amount */}
            <div className="mt-6 inline-block rounded-2xl border border-white/10 bg-white/5 px-8 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50 block">Amount to Pay</span>
              <span className="font-mono text-3xl font-bold text-[#f4d59b]">₹{order.totalAmount}</span>
            </div>

            {/* Dynamic QR Code */}
            {upiIntent?.qrPayload && (
              <div className="mt-6 flex flex-col items-center">
                <div className="rounded-2xl border-4 border-[#d6a85e] bg-white p-3 shadow-2xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      upiIntent.qrPayload
                    )}`}
                    alt="UPI Payment QR"
                    className="h-48 w-48 object-contain"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {/* Mobile Deep Link */}
                  {upiIntent.intentUrl && (
                    <a
                      href={upiIntent.intentUrl}
                      className="rounded-full bg-[#d6a85e] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] shadow hover:brightness-110"
                    >
                      Pay via UPI App
                    </a>
                  )}

                  {/* Copy UPI ID */}
                  <button
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-white/80 hover:border-white/40"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? "Copied UPI ID!" : `Copy: ${upiIntent.upiId}`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* UTR Claim Submission */}
            <div className="mt-8 border-t border-white/10 pt-6 max-w-md mx-auto text-left">
              {isClaimed ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-5 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-emerald-300 font-semibold">
                    <CheckCircle2 size={16} /> Payment Claim Received
                  </span>
                  <p className="mt-2 text-xs text-white/70">
                    Your 12-digit UTR reference has been submitted. Restaurant staff are verifying the bank credit.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleClaimSubmit} className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.16em] text-white/70 font-medium">
                    Enter 12-Digit UPI Ref / UTR Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 423891823912"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                    />
                    <button
                      type="submit"
                      disabled={claimMutation.isPending}
                      className="rounded-xl bg-[#d6a85e] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#161016] hover:brightness-110 disabled:opacity-50"
                    >
                      {claimMutation.isPending ? "Submitting…" : "I Have Paid"}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/40">
                    Found in your UPI payment receipt. This allows the kitchen to verify your payment instantly.
                  </p>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Order Details Card */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Current Status</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  order.orderStatus === "cancelled"
                    ? "bg-red-500"
                    : order.orderStatus === "delivered"
                    ? "bg-emerald-400"
                    : "bg-emerald-400 animate-pulse"
                }`} />
                <span className="font-serif text-xl sm:text-2xl text-white capitalize">
                  {order.orderStatus === "payment_claimed"
                    ? "Payment Claimed - Verification In Progress"
                    : order.orderStatus === "payment_verified" || order.orderStatus === "accepted"
                    ? "Order Confirmed"
                    : order.orderStatus === "preparing"
                    ? "Cooking in Kitchen"
                    : order.orderStatus === "ready"
                    ? "Packed & Ready"
                    : order.orderStatus === "out_for_delivery"
                    ? "Out for Delivery"
                    : order.orderStatus === "delivered"
                    ? "Delivered"
                    : order.orderStatus === "cancelled"
                    ? "Order Cancelled"
                    : (order.orderStatus as string).replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Direct Kitchen WhatsApp Confirmation */}
              <a
                href={`https://wa.me/${(settings?.whatsapp || "919876543210").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Namaste Shri Radhe Radhe Restaurant!\n\nI just placed Order #${order.orderNumber} for ₹${order.totalAmount} (${order.fulfillmentType}).\nCustomer: ${order.customerName} (${order.customerPhone}).\nPlease confirm kitchen preparation and dispatch details!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg"
              >
                <MessageCircle size={15} />
                <span>Confirm on WhatsApp</span>
              </a>

              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*Shri Radhe Radhe Restaurant - Order #${order.orderNumber}*\nStatus: ${order.orderStatus.replace(/_/g, " ")}\nTotal: ₹${order.totalAmount}\nTrack order: ${typeof window !== "undefined" ? window.location.origin : ""}/track/${order.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <span>Share Order</span>
              </a>

              {/* Order Tracking Button */}
              {order.fulfillmentType === "delivery" && (
                <Link
                  href={`/track/${order.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d6a85e] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] hover:brightness-110 shadow"
                >
                  <Bike size={15} />
                  <span>{order.orderStatus === "out_for_delivery" ? "Live Driver Map" : "Track Order Status"}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 text-xs text-white/70">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d6a85e] mb-1">Customer</p>
              <p className="text-white font-medium">{order.customerName}</p>
              <p>{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d6a85e] mb-1">Fulfillment</p>
              <p className="text-white font-medium capitalize">{order.fulfillmentType}</p>
              {order.addressSnapshot && <p className="mt-0.5">{order.addressSnapshot}</p>}
            </div>
          </div>
        </section>

        {/* Navigation Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:border-[#d6a85e] hover:text-white transition"
          >
            ← Back to Home
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-full bg-[#d6a85e] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] hover:bg-[#e4be7b] transition shadow"
          >
            Browse Menu →
          </Link>
        </div>
      </main>
    </div>
  );
}
