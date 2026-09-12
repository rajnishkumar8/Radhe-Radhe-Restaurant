import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Lock,
  LogOut,
  AlertCircle,
  MapPin,
  Star,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";
import { OrderReviewModal } from "@/components/OrderReviewModal";

export default function CustomerProfile() {
  const [, navigate] = useLocation();
  const { addItem, openCart } = useCart();
  const [reviewingOrder, setReviewingOrder] = useState<{ id: number; orderNumber: string } | null>(null);

  const { data: user, isLoading: userLoading, refetch: refetchUser } = trpc.auth.me.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.customer.myOrders.useQuery(undefined, {
    enabled: Boolean(user),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetchUser();
      navigate("/");
    },
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      refetchUser();
      setIsEditingProfile(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    },
    onError: (err) => {
      setProfileError(err.message || "Failed to update profile.");
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Sync profile form when user data loads or edit mode is entered
  useEffect(() => {
    if (user && isEditingProfile) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      setProfileError("");
    }
  }, [user, isEditingProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    if (profileForm.name.trim().length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }
    if (profileForm.phone && profileForm.phone.replace(/[\s-]/g, "").length < 10) {
      setProfileError("Phone number must be at least 10 digits.");
      return;
    }

    updateProfileMutation.mutate({
      name: profileForm.name.trim(),
      phone: profileForm.phone.replace(/[\s-]/g, "") || undefined,
      email: profileForm.email.trim() || undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileError("");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword || undefined,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password. Please check your current password.");
    }
  };

  const handleReorder = (order: any) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        addItem(
          {
            id: item.menuItemId,
            name: item.itemNameSnapshot || "Dish",
            price: Number(item.unitPriceSnapshot || 0),
            dietary: "veg",
          },
          item.quantity || 1
        );
      }
      openCart();
    } else {
      // Items snapshot not available — direct user to menu to re-order manually
      alert("Item details for this order are no longer available. Please browse the menu to re-order.");
      navigate("/menu");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-medium text-emerald-400">Delivered</span>;
      case "out_for_delivery":
        return <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-medium text-amber-300 animate-pulse">Out for Delivery</span>;
      case "preparing":
        return <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-[10px] font-medium text-blue-300">In Kitchen</span>;
      case "confirmed":
        return <span className="rounded-full bg-[#d6a85e]/15 border border-[#d6a85e]/30 px-2.5 py-1 text-[10px] font-medium text-[#f4d59b]">Confirmed</span>;
      case "cancelled":
        return <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[10px] font-medium text-red-400">Cancelled</span>;
      default:
        return <span className="rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-medium text-white/80">Pending</span>;
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d6a85e] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8]">
        <Navbar />
        <div className="mx-auto max-w-lg px-5 py-36 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/5 border border-white/15 text-[#d6a85e] mb-4">
            <User size={30} />
          </div>
          <h2 className="font-serif text-3xl">Sign in to view your profile</h2>
          <p className="mt-2 text-sm text-white/60">
            Sign in with your phone or email to track your past orders, manage your account, and re-order your favorites.
          </p>
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

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 pb-28 pt-28 lg:px-10">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#d6a85e]">Customer Account</p>
            <h1 className="mt-1 font-serif text-4xl sm:text-5xl">{user.name || "Diner"}</h1>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
          >
            <LogOut size={14} />
            <span>{logoutMutation.isPending ? "Signing out…" : "Sign Out"}</span>
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Details & Password Card */}
          <div className="space-y-6 lg:col-span-1">
            {/* Info Card */}
            <div className="rounded-3xl border border-white/10 bg-[#211721] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-white">Account Details</h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/10 px-3 py-1.5 text-[11px] font-medium text-[#f4d59b] hover:bg-[#d6a85e]/25 transition"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/70 hover:bg-white/10 transition"
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>

              {profileSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Profile updated successfully!
                </div>
              )}

              {profileError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} /> {profileError}
                </div>
              )}

              {!isEditingProfile ? (
                /* Read-only view */
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[#d6a85e] shrink-0">
                      <User size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Full Name</p>
                      <p className="font-medium text-white truncate">{user.name || "Guest Customer"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[#d6a85e] shrink-0">
                      <Phone size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Phone Number</p>
                      <p className="font-medium text-white font-mono">{user.phone || "Not provided"}</p>
                    </div>
                  </div>

                  {user.email && (
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[#d6a85e] shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] uppercase tracking-wider text-white/50">Email</p>
                        <p className="font-medium text-white truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[#d6a85e] shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Member Since</p>
                      <p className="font-medium text-white">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Recent"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit form */
                <form onSubmit={handleProfileSave} className="space-y-3.5">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                      <User size={12} className="text-[#d6a85e]" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#d6a85e] transition placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                      <Phone size={12} className="text-[#d6a85e]" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-[#d6a85e] transition placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
                      <Mail size={12} className="text-[#d6a85e]" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#d6a85e] transition placeholder:text-white/30"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#d6a85e] py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#161016] hover:bg-[#e4be7b] transition disabled:opacity-50"
                    >
                      <Save size={13} />
                      {updateProfileMutation.isPending ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-medium text-white/70 hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change Password Card */}
            <div className="rounded-3xl border border-white/10 bg-[#211721] p-6 shadow-xl">
              <h2 className="font-serif text-xl text-white mb-2 flex items-center gap-2">
                <Lock size={16} className="text-[#d6a85e]" /> Change Password
              </h2>
              <p className="text-[11px] text-white/60 mb-4">Set a secure password for easier logins across devices.</p>

              {passwordSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Password updated successfully!
                </div>
              )}

              {passwordError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} /> {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Current Password (if set)</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#d6a85e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#d6a85e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#d6a85e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full rounded-full bg-[#d6a85e] py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#161016] hover:bg-[#e4be7b] transition disabled:opacity-50 mt-2"
                >
                  {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-[#211721] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl text-white">Order History</h2>
                  <p className="text-xs text-white/60 mt-0.5">Track live deliveries or re-order past culinary favorites.</p>
                </div>
                <Link
                  href="/menu"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-[#d6a85e] hover:underline"
                >
                  Browse Menu <ArrowRight size={13} />
                </Link>
              </div>

              {ordersLoading ? (
                <div className="py-12 text-center text-xs text-white/50">Loading your orders…</div>
              ) : !orders || orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
                  <Package className="mx-auto text-white/30 mb-3" size={36} />
                  <p className="text-sm text-white/80 font-medium">No past orders yet</p>
                  <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                    When you order pure vegetarian culinary specialties from Radhe Radhe, they will appear here.
                  </p>
                  <Link
                    href="/menu"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d6a85e] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#161016]"
                  >
                    Explore Our Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-[#161016]/50 p-5 transition hover:border-[#d6a85e]/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#f4d59b]">{order.orderNumber}</span>
                          {getStatusBadge(order.orderStatus)}
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-base font-bold text-white">₹{order.totalAmount}</span>
                          <span className="block text-[10px] text-white/50">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/70">
                        <div className="space-y-1">
                          <p className="capitalize text-white/90">
                            <strong>Fulfillment:</strong> {order.fulfillmentType} ({order.paymentMethod.replace(/_/g, " ")})
                          </p>
                          {order.addressSnapshot && (
                            <p className="text-[11px] text-white/60 line-clamp-1 flex items-center gap-1">
                              <MapPin size={12} className="shrink-0 text-[#d6a85e]" />
                              {order.addressSnapshot}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                          {order.orderStatus === "delivered" && (
                            <button
                              onClick={() => setReviewingOrder({ id: order.id, orderNumber: order.orderNumber })}
                              className="inline-flex items-center gap-1 rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/15 px-3 py-1.5 text-[11px] font-medium text-[#f4d59b] hover:bg-[#d6a85e] hover:text-[#161016] transition"
                            >
                              <Star size={11} fill="currentColor" /> Rate Meal
                            </button>
                          )}
                          <Link
                            href={`/track/${order.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-[11px] text-white hover:border-[#d6a85e] hover:text-[#d6a85e] transition"
                          >
                            <ExternalLink size={12} /> Track
                          </Link>
                          <button
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#d6a85e] px-3.5 py-1.5 text-[11px] font-semibold text-[#161016] hover:bg-[#e4be7b] transition shadow"
                          >
                            <RotateCcw size={12} /> Re-order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {reviewingOrder && (
        <OrderReviewModal
          orderId={reviewingOrder.id}
          orderNumber={reviewingOrder.orderNumber}
          isOpen={Boolean(reviewingOrder)}
          onClose={() => setReviewingOrder(null)}
        />
      )}
    </div>
  );
}
