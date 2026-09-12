import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MapPin, UserRound, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Profile() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const { data: myOrders } = trpc.customer.myOrders.useQuery(undefined, { enabled: Boolean(user) });

  const [form, setForm] = useState({ label: "Home", addressLine: "", city: "Darbhanga", postalCode: "", landmark: "" });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#161016] text-[#d6a85e]">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-md px-5 py-36 text-center">
          <UserRound className="mx-auto mb-5 text-[#d6a85e]" size={36} />
          <h1 className="font-serif text-4xl">Guest Dining Account</h1>
          <p className="mt-3 text-sm text-white/60">
            Sign in through the navigation bar to review past order history and manage saved delivery locations.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-[#d6a85e] px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016]"
          >
            Return to Storefront
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-5 pb-28 pt-32 lg:px-10">
        <a href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white mb-6">
          <ArrowLeft size={14} /> Back to storefront
        </a>

        <div className="rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#d6a85e]">Diner Account</span>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{user.name || "Guest Diner"}</h1>
              <p className="mt-1 text-xs text-white/60">{user.email || user.phone || "Direct Account"}</p>
            </div>
            <span className="rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f4d59b] capitalize">
              Role: {user.role.replace(/_/g, " ")}
            </span>
          </div>

          {/* Past Orders History */}
          <div className="mt-8">
            <h2 className="font-serif text-2xl mb-4">Past Orders</h2>
            {myOrders && myOrders.length > 0 ? (
              <div className="space-y-3">
                {myOrders.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">#{order.orderNumber}</span>
                      <p className="text-white/60 mt-0.5">{order.fulfillmentType} · {order.customerName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase font-bold text-white/80">
                        {order.orderStatus.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono font-bold text-[#f4d59b]">₹{order.totalAmount}</span>
                      <a href={`/order-confirmation/${order.id}`} className="text-[#d6a85e] underline ml-2">
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/50">No past orders placed yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
