import { useState, useEffect, useRef } from "react";
import { Bike, MapPin, Phone, CheckCircle2, Navigation, AlertTriangle, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";

export default function DriverPortal() {
  const { data: user, refetch: refetchUser } = trpc.auth.me.useQuery();
  const loginMutation = trpc.auth.loginAsRole.useMutation({ onSuccess: () => refetchUser() });

  const { data: orders, refetch: refetchOrders } = trpc.driver.assignedOrders.useQuery(undefined, {
    enabled: Boolean(user && ["driver", "owner", "manager"].includes(user.role)),
    refetchInterval: 10000,
  });

  const startDeliveryMutation = trpc.driver.startDelivery.useMutation({
    onSuccess: () => refetchOrders(),
  });

  const markDeliveredMutation = trpc.driver.markDelivered.useMutation({
    onSuccess: () => {
      stopTracking();
      refetchOrders();
    },
  });

  const sendPingMutation = trpc.driver.sendLocationPing.useMutation();

  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Standby");
  const watchIdRef = useRef<number | null>(null);

  const startTracking = (orderId: number) => {
    setActiveTrackingOrderId(orderId);
    startDeliveryMutation.mutate({ orderId });

    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported by device");
      return;
    }

    setGpsStatus("Acquiring high-accuracy GPS…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsStatus(`Streaming GPS (Accuracy: ±${Math.round(accuracy)}m)`);

        sendPingMutation.mutate({
          orderId,
          latitude: String(latitude),
          longitude: String(longitude),
          accuracy,
        });
      },
      (error) => {
        setGpsStatus(`GPS Warning: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActiveTrackingOrderId(null);
    setGpsStatus("Standby");
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const isAuthorized = user && ["driver", "owner", "manager"].includes(user.role);

  return (
    <div className="min-h-screen bg-[#110e11] text-[#f8f1e8] selection:bg-[#10b981] selection:text-[#110e11]">
      <Navbar />

      <main className="mx-auto max-w-xl px-5 pb-28 pt-28">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-semibold">
              Radhe Radhe Dispatch
            </span>
            <h1 className="font-serif text-3xl text-white">Driver Portal</h1>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300">
            <Bike size={14} /> Partner Active
          </span>
        </div>

        {/* Authentication Gate */}
        {!isAuthorized ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-[#1c161c] p-8 text-center">
            <Bike size={36} className="mx-auto text-emerald-400 mb-4" />
            <h2 className="font-serif text-2xl text-white">Driver Authentication Required</h2>
            <p className="mt-2 text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
              Please authenticate with a registered delivery partner profile to view order manifests and broadcast GPS coordinates.
            </p>
            <button
              onClick={() => loginMutation.mutate({ role: "driver", name: "Amit Kumar (Driver)" })}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#110e11] hover:brightness-110"
            >
              <LogIn size={15} /> Authenticate as Delivery Partner
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* GPS Telemetry Bar */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    activeTrackingOrderId ? "bg-emerald-400 animate-ping" : "bg-white/30"
                  }`}
                />
                <span className="text-white/80">{gpsStatus}</span>
              </div>
              {activeTrackingOrderId && (
                <button
                  onClick={stopTracking}
                  className="text-[10px] uppercase tracking-[0.16em] text-amber-400 underline"
                >
                  Pause GPS
                </button>
              )}
            </div>

            {/* Assigned Orders List */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-white">Assigned Deliveries ({orders?.length || 0})</h3>

              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const isTrackingThis = activeTrackingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className={`rounded-3xl border p-5 transition ${
                        isTrackingThis
                          ? "border-emerald-500 bg-[#16201a]"
                          : "border-white/10 bg-[#1c161c]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">
                            Order #{order.orderNumber}
                          </span>
                          <h4 className="font-serif text-2xl text-white mt-1">{order.customerName}</h4>
                        </div>
                        <span className="font-mono text-base font-semibold text-[#f4d59b]">
                          ₹{order.totalAmount}
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs">
                        <p className="flex items-start gap-2 text-white/90 leading-relaxed">
                          <MapPin size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{order.addressSnapshot || "Darbhanga Local Delivery"}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:border-white/40"
                          >
                            <Phone size={13} /> Call Diner
                          </a>
                        )}

                        {order.orderStatus === "ready" && (
                          <button
                            onClick={() => startTracking(order.id)}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#110e11] hover:brightness-110 shadow"
                          >
                            <Navigation size={13} /> Start Delivery
                          </button>
                        )}

                        {order.orderStatus === "out_for_delivery" && (
                          <button
                            onClick={() => markDeliveredMutation.mutate({ orderId: order.id })}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#110e11] hover:brightness-110 shadow"
                          >
                            <CheckCircle2 size={14} /> Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center text-white/50 text-xs">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-400/60 mb-2" />
                  <p className="font-serif text-lg text-white">No pending deliveries</p>
                  <p className="mt-1">New orders marked "Ready" by the kitchen will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
