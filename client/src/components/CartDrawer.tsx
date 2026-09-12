import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Check, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    totals,
    isCalculating,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    fulfillmentType,
    setFulfillmentType,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [, navigate] = useLocation();
  const [promoInput, setPromoInput] = useState("");

  if (!isOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoInput.trim()) {
      applyCoupon(promoInput);
      setPromoInput("");
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-out Sheet */}
      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-[#f3eadf] text-[#251925] shadow-2xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#251925]/10 p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#9b684c]">Your table, curated</p>
            <h2 className="mt-1 font-serif text-3xl">Your Order ({itemCount})</h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart drawer"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#251925]/15 text-[#251925]/70 transition hover:bg-[#251925]/10 hover:text-[#251925]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="grid min-h-[50vh] place-items-center text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#9b684c]/30 text-[#9b684c]">
                  <ShoppingBag size={28} />
                </span>
                <h3 className="mt-4 font-serif text-2xl">Your table is waiting.</h3>
                <p className="mt-2 text-sm text-[#6e3d2d]/70 max-w-xs mx-auto">
                  Add something memorable from our live-fire menu to begin your order.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate("/menu");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#251925] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#6e3d2d]"
                >
                  <span>Explore Menu</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Fulfillment Toggle */}
              <div className="flex rounded-full border border-[#251925]/15 bg-white/40 p-1">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    fulfillmentType === "delivery"
                      ? "bg-[#251925] text-white shadow"
                      : "text-[#251925]/70 hover:text-[#251925]"
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    fulfillmentType === "pickup"
                      ? "bg-[#251925] text-white shadow"
                      : "text-[#251925]/70 hover:text-[#251925]"
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex gap-4 rounded-2xl border border-[#251925]/10 bg-white/50 p-4 transition"
                  >
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80"}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif text-lg leading-tight text-[#251925]">{item.name}</h4>
                          <span className="font-mono text-sm font-semibold">
                            ₹{(Number(item.price) * item.quantity).toFixed(0)}
                          </span>
                        </div>
                        {item.specialInstructions && (
                          <p className="mt-1 text-xs italic text-[#6e3d2d]/80 line-clamp-1">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-[#251925]/15 bg-[#f3eadf] p-1">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="grid h-6 w-6 place-items-center rounded-full text-[#251925]/80 hover:bg-[#251925]/10"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="grid h-6 w-6 place-items-center rounded-full text-[#251925]/80 hover:bg-[#251925]/10"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-[#b44d3d] hover:opacity-80 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="rounded-2xl border border-[#251925]/10 bg-white/40 p-4">
                {couponCode ? (
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#4e7b56]">
                      <Check size={14} /> Code Applied: {couponCode}
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs uppercase tracking-[0.16em] text-[#b44d3d] underline hover:opacity-80"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-3 text-[#6e3d2d]/50" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter coupon (e.g. WELCOME50)"
                        className="w-full rounded-xl border border-[#251925]/15 bg-white/60 py-2.5 pl-9 pr-3 text-xs uppercase placeholder:normal-case placeholder:text-[#6e3d2d]/40 outline-none focus:border-[#9b684c]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#251925] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#6e3d2d]"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer with Calculation Breakdown */}
        {items.length > 0 && (
          <div className="border-t border-[#251925]/10 bg-white/75 p-6 backdrop-blur-sm">
            <div className="space-y-2 text-xs text-[#6e3d2d]/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-[#251925]">₹{totals?.subtotal || subtotal.toFixed(0)}</span>
              </div>
              {totals && Number(totals.discountAmount) > 0 && (
                <div className="flex justify-between text-[#4e7b56] font-medium">
                  <span>Discount ({totals.appliedCouponCode})</span>
                  <span className="font-mono">-₹{totals.discountAmount}</span>
                </div>
              )}
              {fulfillmentType === "delivery" && (
                <>
                  <div className="flex justify-between">
                    <span>Delivery Partner Fee</span>
                    <span className="font-mono">
                      {totals && Number(totals.deliveryFee) === 0 ? (
                        <span className="text-[#4e7b56] font-semibold">FREE</span>
                      ) : (
                        `₹${totals?.deliveryFee || "40.00"}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Eco Packaging Charges</span>
                    <span className="font-mono">₹{totals?.packagingFee || "25.00"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span className="font-mono">₹{totals?.taxAmount || (subtotal * 0.05).toFixed(0)}</span>
              </div>
              <div className="flex justify-between border-t border-[#251925]/10 pt-2 text-sm font-semibold text-[#251925]">
                <span>Total Payable</span>
                <span className="font-mono text-base text-[#251925]">
                  {isCalculating ? "Calculating…" : `₹${totals?.totalAmount || subtotal.toFixed(0)}`}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={isCalculating}
              className="mt-5 flex w-full items-center justify-between rounded-full bg-[#251925] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#6e3d2d] disabled:opacity-50 shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
