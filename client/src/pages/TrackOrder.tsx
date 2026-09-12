import { useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, MapPin, Bike, CheckCircle2, Phone, AlertCircle, Star, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { LiveTrackingMap } from "@/components/Map/LiveTrackingMap";
import { OrderReviewModal } from "@/components/OrderReviewModal";

export default function TrackOrder() {
  const [, params] = useRoute("/track/:id");
  const orderId = Number(params?.id || 0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const { data: trackData, isLoading } = trpc.tracking.getLiveStatus.useQuery(
    { orderId },
    { enabled: Boolean(orderId), refetchInterval: 6000 }
  );
  const { data: settings } = trpc.restaurant.publicSettings.useQuery();

  if (isLoading || !trackData) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <p className="font-serif text-2xl">Connecting to delivery tracking network…</p>
        </div>
      </div>
    );
  }

  const isOutForDelivery = trackData.orderStatus === "out_for_delivery";
  const isDelivered = trackData.orderStatus === "delivered";

  const steps = [
    { key: "accepted", label: "Confirmed", active: ["accepted", "preparing", "ready", "out_for_delivery", "delivered"].includes(trackData.orderStatus) },
    { key: "preparing", label: "In Kitchen", active: ["preparing", "ready", "out_for_delivery", "delivered"].includes(trackData.orderStatus) },
    { key: "out_for_delivery", label: "On the Road", active: ["out_for_delivery", "delivered"].includes(trackData.orderStatus) },
    { key: "delivered", label: "Delivered", active: trackData.orderStatus === "delivered" },
  ];

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-32 lg:px-10">
        <Link
          href={`/order-confirmation/${orderId}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft size={14} /> Back to order summary
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#d6a85e]">Live Telemetry</p>
            <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Track Order #{trackData.orderNumber}</h1>
          </div>
          <span className="rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4d59b]">
            Status: {trackData.orderStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Timeline Indicator */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, idx) => (
              <div key={step.key} className="text-center">
                <div
                  className={`mx-auto h-2 w-full rounded-full transition duration-500 ${
                    step.active ? "bg-[#d6a85e]" : "bg-white/10"
                  }`}
                />
                <p className={`mt-3 text-[10px] sm:text-xs uppercase tracking-[0.16em] ${
                  step.active ? "text-white font-semibold" : "text-white/40"
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Map & Delivery Metrics */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Map Section */}
          <div className="h-[420px] sm:h-[480px]">
            <LiveTrackingMap
              restaurantCoords={trackData.restaurantCoords}
              driverCoords={trackData.driverCoords}
              styleUrl={trackData.tileStyleUrl}
              attribution={trackData.attribution}
            />
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            {/* ETA / Distance Card */}
            <div className="rounded-3xl border border-white/10 bg-[#211721] p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6a85e]/20 text-[#d6a85e]">
                  <Bike size={18} />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Delivery Estimate</p>
                  <p className="font-serif text-2xl text-white">
                    {isDelivered
                      ? "Order Delivered"
                      : isOutForDelivery && trackData.distanceEstimate
                      ? `~${trackData.distanceEstimate.estimatedMinutes} Mins Arrival`
                      : "Kitchen Preparing (~25m)"}
                  </p>
                </div>
              </div>

              {isOutForDelivery && trackData.distanceEstimate && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70 flex justify-between">
                  <span>Estimated Road Distance</span>
                  <span className="font-mono text-white font-semibold">
                    ~{trackData.distanceEstimate.straightLineKm} km
                  </span>
                </div>
              )}

              {!isOutForDelivery && !isDelivered && (
                <p className="mt-4 text-xs text-white/50 leading-relaxed">
                  Our delivery partner will be dispatched as soon as the kitchen packages your meal fresh from the
                  tandoor. Live GPS updates begin upon dispatch.
                </p>
              )}

              {isDelivered && (
                <div className="mt-5 rounded-2xl border border-[#d6a85e]/40 bg-[#d6a85e]/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#d6a85e] font-semibold mb-1">
                    <Sparkles size={14} />
                    <span>How was your meal?</span>
                  </div>
                  <p className="text-[11px] text-white/70 mb-3">
                    Your feedback helps our master chefs maintain authentic Mithila culinary excellence.
                  </p>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#d6a85e] px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#161016] hover:bg-[#e4be7b] transition shadow"
                  >
                    <Star size={12} fill="currentColor" /> Rate & Review Order
                  </button>
                </div>
              )}
            </div>

            {/* Destination Address */}
            <div className="rounded-3xl border border-white/10 bg-[#211721] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d6a85e] flex items-center gap-1.5 mb-2">
                <MapPin size={13} /> Destination Address
              </p>
              <p className="text-sm text-white/90 leading-relaxed">
                {trackData.addressSnapshot || "Pickup at Restaurant Counter"}
              </p>

              <div className="mt-5 border-t border-white/10 pt-4 flex justify-between items-center text-xs">
                <span className="text-white/60">Need assistance?</span>
                <a
                  href={`tel:${settings?.phone || "+919876543210"}`}
                  className="inline-flex items-center gap-1 text-[#d6a85e] hover:underline"
                >
                  <Phone size={13} /> Call Dining Room
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <OrderReviewModal
        orderId={orderId}
        orderNumber={trackData.orderNumber}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
    </div>
  );
}
