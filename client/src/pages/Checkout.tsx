import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, ShieldCheck, QrCode, Banknote, Store, AlertCircle, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, totals, fulfillmentType, setFulfillmentType, couponCode, clearCart } = useCart();
  const { data: user } = trpc.auth.me.useQuery();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    landmark: "",
    notes: "",
    paymentMethod: "direct_upi" as "direct_upi" | "cash_on_delivery" | "pay_at_pickup",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const [error, setError] = useState("");
  const placeOrderMutation = trpc.customer.placeOrder.useMutation();

  // Reset payment method when fulfillment type changes to prevent invalid combos
  useEffect(() => {
    setForm((prev) => ({ ...prev, paymentMethod: "direct_upi" }));
  }, [fulfillmentType]);

  const isStaff = Boolean(user && ["owner", "manager", "order_staff", "admin"].includes(user.role));

  if (isStaff) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6a85e]/20 text-[#d6a85e] border border-[#d6a85e]/40 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="font-serif text-3xl">Administrator Session</h2>
          <p className="mt-3 text-sm text-white/65 leading-relaxed">
            You are logged in as restaurant staff ({user?.name || "Owner"}). Restaurant administrators and kitchen managers oversee live orders rather than placing customer orders.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="rounded-full bg-[#d6a85e] px-7 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-[#161016] hover:bg-[#e4be7b] transition"
            >
              Go to Admin Operations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <h2 className="font-serif text-3xl">Your cart is empty</h2>
          <p className="mt-2 text-sm text-white/60">Select something delicious before checking out.</p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-6 rounded-full bg-[#d6a85e] px-7 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-[#161016]"
          >
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  // Monday closure guard
  const isMonday = new Date().getDay() === 1;
  if (isMonday) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="font-serif text-3xl">We're Closed Today</h2>
          <p className="mt-3 text-sm text-white/65 leading-relaxed">
            Shri Radhe Radhe Restaurant is closed every Monday for kitchen maintenance and staff rest. We are open
            Tuesday through Sunday, 12:00 PM – 11:00 PM.
          </p>
          <p className="mt-2 text-xs text-white/50">Your cart has been saved and will be ready tomorrow.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 rounded-full bg-[#d6a85e] px-7 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-[#161016] hover:bg-[#e4be7b] transition"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Please provide your full name.");
      return;
    }

    const cleanPhone = form.phone.replace(/[^0-9+]/g, "");
    if (!/^\+?[0-9]{10,14}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-14 digit mobile number.");
      return;
    }

    if (fulfillmentType === "delivery" && form.address.trim().length < 10) {
      setError("Please provide a complete delivery address with flat/house number and street.");
      return;
    }

    try {
      const fullAddressSnapshot =
        fulfillmentType === "delivery"
          ? `${form.address.trim()}${form.landmark ? `, Landmark: ${form.landmark.trim()}` : ""}`
          : undefined;

      const order = await placeOrderMutation.mutateAsync({
        customerName: form.name.trim(),
        customerPhone: cleanPhone,
        customerEmail: form.email.trim() || undefined,
        fulfillmentType,
        paymentMethod: form.paymentMethod,
        addressSnapshot: fullAddressSnapshot,
        addressNotes: form.notes.trim() || undefined,
        couponCode: couponCode || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions,
        })),
      });

      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-5 pb-28 pt-32 lg:px-10">
        <button
          onClick={() => navigate("/menu")}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft size={14} /> Back to menu
        </button>

        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#d6a85e]">Final Step</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Checkout</h1>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form Fields */}
          <div className="space-y-8">
            {/* Step 1: Contact */}
            <section className="rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-white">1. Contact Information</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/50">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Priyanshu Sharma"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/50">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/50">Email (Receipt)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@domain.com (optional)"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Fulfillment */}
            <section className="rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-white">2. Fulfillment Method</h2>
              <div className="mt-4 flex rounded-full border border-white/15 bg-white/5 p-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    fulfillmentType === "delivery" ? "bg-[#d6a85e] text-[#161016]" : "text-white/70"
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    fulfillmentType === "pickup" ? "bg-[#d6a85e] text-[#161016]" : "text-white/70"
                  }`}
                >
                  Pickup
                </button>
              </div>

              {fulfillmentType === "delivery" ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/50">Delivery Address</label>
                    <textarea
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="House/Shop number, Landmark, Lohna Road, Dharampur / Manigachhi, Darbhanga"
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/50">Nearby Landmark</label>
                    <input
                      type="text"
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      placeholder="e.g. Near Central Park Gate 3"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d6a85e]"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">Pickup Location:</p>
                    <a
                      href="https://www.google.com/maps/place/Radhe+Communication/@26.2194021,86.2313645,14.68z/data=!4m6!3m5!1s0x39edd7b015579f4f:0x94fc80b038fc4970!8m2!3d26.2182293!4d86.227211!16s%2Fg%2F11c1wwrpth?entry=ttu"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d6a85e] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <MapPin size={12} /> View Map
                    </a>
                  </div>
                  <p className="mt-1">Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar 847407</p>
                  <p className="mt-1 text-white/50">Orders are typically packed and ready in 25–30 minutes.</p>
                </div>
              )}
            </section>

            {/* Step 3: Payment Method */}
            <section className="rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7">
              <h2 className="font-serif text-2xl text-white">3. Payment Method</h2>
              <div className="mt-5 space-y-3">
                <label
                  className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition ${
                    form.paymentMethod === "direct_upi"
                      ? "border-[#d6a85e] bg-[#d6a85e]/15"
                      : "border-white/15 bg-white/5 hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="direct_upi"
                    checked={form.paymentMethod === "direct_upi"}
                    onChange={() => setForm({ ...form, paymentMethod: "direct_upi" })}
                    className="mt-1 accent-[#d6a85e]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-serif text-lg text-white">
                      <QrCode size={18} className="text-[#d6a85e]" />
                      <span>Direct UPI (Recommended)</span>
                    </div>
                    <p className="mt-1 text-xs text-white/60">
                      Scan dynamic QR or pay via any UPI app (GPay, PhonePe, Paytm). 0% gateway surcharge.
                    </p>
                  </div>
                </label>

                {fulfillmentType === "delivery" && (
                  <label
                    className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition ${
                      form.paymentMethod === "cash_on_delivery"
                        ? "border-[#d6a85e] bg-[#d6a85e]/15"
                        : "border-white/15 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash_on_delivery"
                      checked={form.paymentMethod === "cash_on_delivery"}
                      onChange={() => setForm({ ...form, paymentMethod: "cash_on_delivery" })}
                      className="mt-1 accent-[#d6a85e]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-serif text-lg text-white">
                        <Banknote size={18} className="text-[#d6a85e]" />
                        <span>Cash on Delivery</span>
                      </div>
                      <p className="mt-1 text-xs text-white/60">Pay cash directly to the delivery partner upon arrival.</p>
                    </div>
                  </label>
                )}

                {fulfillmentType === "pickup" && (
                  <label
                    className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition ${
                      form.paymentMethod === "pay_at_pickup"
                        ? "border-[#d6a85e] bg-[#d6a85e]/15"
                        : "border-white/15 bg-white/5 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="pay_at_pickup"
                      checked={form.paymentMethod === "pay_at_pickup"}
                      onChange={() => setForm({ ...form, paymentMethod: "pay_at_pickup" })}
                      className="mt-1 accent-[#d6a85e]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-serif text-lg text-white">
                        <Store size={18} className="text-[#d6a85e]" />
                        <span>Pay at Pickup Counter</span>
                      </div>
                      <p className="mt-1 text-xs text-white/60">Pay by cash, card, or UPI at the restaurant counter.</p>
                    </div>
                  </label>
                )}
              </div>
            </section>
          </div>

          {/* Order Summary Column */}
          <div>
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7">
              <h3 className="font-serif text-2xl text-white">Order Summary</h3>

              <div className="mt-5 divide-y divide-white/10 max-h-60 overflow-y-auto space-y-3">
                {items.map((item) => (
                  <div key={item.menuItemId} className="pt-3 first:pt-0 flex justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono text-[#f4d59b]">
                      ₹{(Number(item.price) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-xs text-white/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">₹{totals?.subtotal}</span>
                </div>
                {totals && Number(totals.discountAmount) > 0 && (
                  <div className="flex justify-between text-[#4e7b56] font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-₹{totals.discountAmount}</span>
                  </div>
                )}
                {fulfillmentType === "delivery" && (
                  <>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-mono">
                        {Number(totals?.deliveryFee) === 0 ? "FREE" : `₹${totals?.deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eco Packaging</span>
                      <span className="font-mono">₹{totals?.packagingFee}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>GST Tax (5%)</span>
                  <span className="font-mono">₹{totals?.taxAmount}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                  <span>Payable Total</span>
                  <span className="font-mono text-lg text-[#f4d59b]">₹{totals?.totalAmount}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placeOrderMutation.isPending}
                className="mt-8 w-full rounded-full bg-[#d6a85e] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] transition duration-200 hover:brightness-110 disabled:opacity-50 shadow-xl"
              >
                {placeOrderMutation.isPending ? "Placing Order…" : `Place Order · ₹${totals?.totalAmount}`}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
                <ShieldCheck size={13} className="text-[#d6a85e]" />
                <span>100% Server Verified & Encrypted</span>
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
