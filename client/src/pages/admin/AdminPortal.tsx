import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Utensils,
  Settings,
  CalendarCheck,
  FileText,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  TrendingUp,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Volume2,
  VolumeX,
  Search,
  Users,
  KeyRound,
  Shield,
  ShieldCheck,
  Lock,
  UserPlus,
  LogOut,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Flame,
  Check,
  Pencil,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";

export default function AdminPortal() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { data: user, refetch: refetchUser } = trpc.auth.me.useQuery();
  const isStaff = Boolean(user && ["owner", "manager", "order_staff", "admin"].includes(user.role));

  const [activeTab, setActiveTab] = useState<
    "orders" | "payments" | "dashboard" | "menu" | "settings" | "reservations" | "audit" | "staff"
  >("orders");

  const [soundAlerts, setSoundAlerts] = useState(true);

  // Admin login state for non-staff sessions
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Staff creation state
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    role: "order_staff" as "order_staff" | "driver" | "manager",
    password: "",
  });

  // Password change state
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Queries (guarded so unauthenticated sessions don't spam 401s)
  const { data: summary, refetch: refetchSummary } = trpc.operations.summary.useQuery(undefined, {
    refetchInterval: 8000,
    enabled: isStaff,
  });
  const { data: orders, refetch: refetchOrders } = trpc.operations.orders.useQuery(undefined, {
    refetchInterval: 6000,
    enabled: isStaff,
  });
  const { data: pendingPayments, refetch: refetchPayments } = trpc.operations.pendingPayments.useQuery(undefined, {
    refetchInterval: 6000,
    enabled: isStaff,
  });
  const { data: menuList, refetch: refetchMenu } = trpc.menu.list.useQuery({ includeUnavailable: true });
  const { data: categories, refetch: refetchCategories } = trpc.menu.categories.useQuery();
  const { data: settings, refetch: refetchSettings } = trpc.admin.getSettings.useQuery();
  const { data: reservations, refetch: refetchReservations } = trpc.operations.reservations.useQuery(undefined, {
    enabled: isStaff,
  });
  const { data: auditLogs, refetch: refetchAudit } = trpc.admin.auditLogs.useQuery(undefined, {
    enabled: isStaff,
  });
  const { data: teamMembers, refetch: refetchTeam } = trpc.admin.teamMembers.useQuery(undefined, {
    enabled: isStaff,
  });

  // Mutations
  const updateStatusMutation = trpc.operations.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
      refetchSummary();
    },
  });

  const verifyPaymentMutation = trpc.operations.verifyPayment.useMutation({
    onSuccess: () => {
      refetchPayments();
      refetchOrders();
      refetchSummary();
    },
  });

  const rejectPaymentMutation = trpc.operations.rejectPayment.useMutation({
    onSuccess: () => {
      refetchPayments();
      refetchOrders();
    },
  });

  const togglePauseMutation = trpc.admin.toggleOrderPause.useMutation({
    onSuccess: () => refetchSettings(),
  });

  const uploadImageMutation = trpc.admin.uploadImage.useMutation();

  const deleteMenuItemMutation = trpc.admin.deleteMenuItem.useMutation({
    onSuccess: () => {
      utils.menu.list.invalidate();
      refetchMenu();
    },
  });

  const updateSettingsMutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => refetchSettings(),
  });

  const createMemberMutation = trpc.admin.createTeamMember.useMutation({
    onSuccess: () => {
      refetchTeam();
      setIsNewMemberOpen(false);
      setNewMember({ name: "", phone: "", role: "order_staff", password: "" });
    },
  });

  const removeMemberMutation = trpc.admin.removeTeamMember.useMutation({
    onSuccess: () => refetchTeam(),
  });

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setPasswordSuccess("Password updated successfully.");
      setPasswordError("");
      setNewAdminPassword("");
      setCurrentAdminPassword("");
    },
    onError: err => {
      setPasswordError(err.message || "Failed to update password.");
      setPasswordSuccess("");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        localStorage.removeItem("app_session_token");
      } catch {}
      refetchUser();
    },
  });

  const adminLoginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: data => {
      if (data?.token) {
        try {
          localStorage.setItem("app_session_token", data.token);
        } catch {}
      }
      setAdminError("");
      refetchUser();
      refetchOrders();
      refetchSummary();
    },
    onError: err => {
      setAdminError(err.message || "Invalid administrator credentials.");
    },
  });

  // State for adding new dish
  const [isNewDishOpen, setIsNewDishOpen] = useState(false);
  const [dishError, setDishError] = useState("");
  const [dishSuccess, setDishSuccess] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [newDish, setNewDish] = useState({
    name: "",
    description: "",
    categoryId: 1,
    price: "350",
    discountPrice: "",
    dietary: "veg" as "veg" | "non_veg" | "egg" | "vegan" | "jain",
    spiceLevel: 1,
    prepTimeMinutes: 20,
    imageUrl: "",
    isFeatured: false,
    isBestseller: false,
  });

  const createMenuItemMutation = trpc.admin.createMenuItem.useMutation({
    onSuccess: item => {
      utils.menu.list.invalidate();
      utils.menu.categories.invalidate();
      refetchMenu();
      setIsNewDishOpen(false);
      setDishError("");
      setDishSuccess(`Dish "${item.name}" created and added to catalog successfully!`);
      setTimeout(() => setDishSuccess(""), 4500);
      setNewDish({
        name: "",
        description: "",
        categoryId: categories?.[0]?.id || 1,
        price: "",
        discountPrice: "",
        dietary: "veg",
        spiceLevel: 1,
        prepTimeMinutes: 20,
        imageUrl: "",
        isFeatured: false,
        isBestseller: false,
      });
      setImagePreview("");
    },
    onError: err => {
      setDishError(err.message || "Failed to create dish. Please check all fields.");
    },
  });

  // Editing dish state
  const [editingDish, setEditingDish] = useState<{
    id: number;
    name: string;
    description: string;
    categoryId: number;
    price: string;
    discountPrice: string;
    dietary: "veg" | "non_veg" | "egg" | "vegan" | "jain";
    spiceLevel: number;
    prepTimeMinutes: number;
    imageUrl: string;
    isFeatured: boolean;
    isBestseller: boolean;
    isAvailable: boolean;
  } | null>(null);
  const [isEditingUploading, setIsEditingUploading] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState("");

  // Menu tab filters in Admin
  const [adminMenuCategoryFilter, setAdminMenuCategoryFilter] = useState<number | null>(null);
  const [adminMenuSearch, setAdminMenuSearch] = useState("");

  const updateMenuItemMutation = trpc.admin.updateMenuItem.useMutation({
    onSuccess: () => {
      utils.menu.list.invalidate();
      utils.menu.categories.invalidate();
      refetchMenu();
      setEditingDish(null);
      setDishError("");
      setDishSuccess("Dish details and photography updated successfully!");
      setTimeout(() => setDishSuccess(""), 4500);
    },
    onError: err => {
      setDishError(err.message || "Failed to update dish.");
    },
  });

  const compressAndReadImage = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const webpData = canvas.toDataURL("image/webp", quality);
            if (webpData && webpData.length > 50) {
              resolve(webpData);
              return;
            }
          } catch {}
          try {
            const jpegData = canvas.toDataURL("image/jpeg", quality);
            resolve(jpegData);
          } catch {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDishError("");
    setIsUploadingImage(true);

    try {
      const base64Data = await compressAndReadImage(file);
      setImagePreview(base64Data);

      const res = await uploadImageMutation.mutateAsync({
        base64Data,
        originalName: file.name,
      });

      setNewDish(prev => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      setDishError(err?.message || "Failed to process and upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDish) return;

    setDishError("");
    setIsEditingUploading(true);

    try {
      const base64Data = await compressAndReadImage(file);
      setEditImagePreview(base64Data);

      const res = await uploadImageMutation.mutateAsync({
        base64Data,
        originalName: file.name,
      });

      setEditingDish(prev => prev ? ({ ...prev, imageUrl: res.url }) : null);
    } catch (err: any) {
      setDishError(err?.message || "Failed to process and upload image.");
    } finally {
      setIsEditingUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleCreateDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name.trim()) {
      setDishError("Please enter a dish name.");
      return;
    }
    if (!newDish.description.trim()) {
      setDishError("Please enter a culinary description.");
      return;
    }
    const cleanPrice = newDish.price.replace(/[^0-9.]/g, "");
    if (!cleanPrice || isNaN(Number(cleanPrice)) || Number(cleanPrice) <= 0) {
      setDishError("Please enter a valid positive price in ₹.");
      return;
    }

    setDishError("");
    createMenuItemMutation.mutate({
      ...newDish,
      price: cleanPrice,
      discountPrice: newDish.discountPrice ? newDish.discountPrice.replace(/[^0-9.]/g, "") : undefined,
      categoryId: Number(newDish.categoryId) || categories?.[0]?.id || 1,
      prepTimeMinutes: Number(newDish.prepTimeMinutes) || 20,
      spiceLevel: Number(newDish.spiceLevel) || 0,
      imageUrl: newDish.imageUrl.trim() || undefined,
    });
  };

  const handleUpdateDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    if (!editingDish.name.trim()) {
      setDishError("Dish name is required.");
      return;
    }
    const cleanPrice = editingDish.price.replace(/[^0-9.]/g, "");
    if (!cleanPrice || isNaN(Number(cleanPrice)) || Number(cleanPrice) <= 0) {
      setDishError("Please enter a valid positive price in ₹.");
      return;
    }

    setDishError("");
    updateMenuItemMutation.mutate({
      id: editingDish.id,
      name: editingDish.name.trim(),
      description: editingDish.description.trim(),
      categoryId: Number(editingDish.categoryId),
      price: cleanPrice,
      discountPrice: editingDish.discountPrice ? editingDish.discountPrice.replace(/[^0-9.]/g, "") : null,
      dietary: editingDish.dietary,
      spiceLevel: Number(editingDish.spiceLevel) || 0,
      prepTimeMinutes: Number(editingDish.prepTimeMinutes) || 20,
      imageUrl: editingDish.imageUrl ? editingDish.imageUrl.trim() : null,
      isFeatured: editingDish.isFeatured,
      isBestseller: editingDish.isBestseller,
      isAvailable: editingDish.isAvailable,
    });
  };

  // Settings state
  const [settingsForm, setSettingsForm] = useState<any>(null);

  // If not authenticated as staff or owner, present crisp Admin Sign-In Screen
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
        <Navbar />
        <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-4 pt-24 pb-12">
          <div className="rounded-[2.5rem] border border-white/10 bg-[#211721] p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6a85e]/15 text-[#f4d59b] border border-[#d6a85e]/30">
                <Shield size={32} />
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-[#d6a85e] font-semibold">
                Operational Management Console
              </p>
              <h2 className="mt-1 font-serif text-3xl text-white">Staff & Admin Login</h2>
              <p className="mt-2 text-xs text-white/60">
                Restricted to restaurant owners, kitchen managers, and dispatch staff.
              </p>
            </div>

            {adminError && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{adminError}</span>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!adminUsername || !adminPassword) {
                  setAdminError("Please enter both username and password.");
                  return;
                }
                adminLoginMutation.mutate({
                  username: adminUsername,
                  password: adminPassword,
                });
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                  Username or Admin Email
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 px-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 px-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoginMutation.isPending}
                className="w-full rounded-full bg-[#d6a85e] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] transition hover:bg-[#e4be7b] disabled:opacity-50 shadow-lg mt-2"
              >
                {adminLoginMutation.isPending ? "Authenticating..." : "Sign In to Operations"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1f171a] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-28 sm:px-6 lg:px-8">
        {/* Top Operational Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f171a]/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#9b684c] font-semibold">
                Operations Console
              </span>
              {settings?.orderingPaused && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
                  Orders Paused
                </span>
              )}
            </div>
            <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#1f171a]">
              {settings?.restaurantName || "Radhe Radhe Restaurant"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundAlerts(!soundAlerts)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1f171a]/15 bg-white px-3.5 py-2 text-xs text-[#1f171a]/70 hover:bg-stone-50"
            >
              {soundAlerts ? <Volume2 size={14} className="text-emerald-600" /> : <VolumeX size={14} />}
              <span>{soundAlerts ? "Audio On" : "Muted"}</span>
            </button>

            {/* Emergency Pause Switch */}
            <button
              onClick={() =>
                togglePauseMutation.mutate({
                  paused: !settings?.orderingPaused,
                  message: "We are temporarily paused for kitchen restock. Online orders will resume shortly.",
                })
              }
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition shadow ${
                settings?.orderingPaused
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[#b44d3d] text-white hover:bg-red-800"
              }`}
            >
              {settings?.orderingPaused ? (
                <>
                  <PlayCircle size={15} /> Resume Online Orders
                </>
              ) : (
                <>
                  <PauseCircle size={15} /> Pause Online Orders
                </>
              )}
            </button>

            {/* Admin Sign Out */}
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-sm"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-[#1f171a]/10 pb-3 scrollbar-none">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "orders" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders Queue</span>
            {summary && summary.newOrders > 0 && (
              <span className="rounded-full bg-[#d6a85e] px-2 py-0.5 text-[10px] text-[#161016] font-bold">
                {summary.newOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "payments" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <CreditCard size={14} />
            <span>UPI Verification</span>
            {pendingPayments && pendingPayments.length > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white font-bold animate-pulse">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "dashboard" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("menu")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "menu" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <Utensils size={14} />
            <span>Menu CMS</span>
          </button>

          <button
            onClick={() => setActiveTab("reservations")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "reservations" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <CalendarCheck size={14} />
            <span>Reservations</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "settings" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <Settings size={14} />
            <span>Restaurant Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "staff" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <Users size={14} />
            <span>Team & Staff</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === "audit" ? "bg-[#1f171a] text-white shadow" : "text-[#1f171a]/60 hover:text-[#1f171a]"
            }`}
          >
            <FileText size={14} />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="mt-8">
          {/* 1. ORDERS QUEUE */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Incoming Orders & Status Pipeline</h2>
                  <p className="text-xs text-[#1f171a]/60">Live kitchen order workflow and dispatch triggers.</p>
                </div>
              </div>

              {orders && orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#1f171a]/10 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f171a]/5 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold uppercase text-[#9b684c]">
                            #{order.orderNumber}
                          </span>
                          <span className="rounded-full bg-stone-100 px-3 py-0.5 text-[10px] uppercase font-semibold text-stone-700">
                            {order.fulfillmentType}
                          </span>
                          <span
                            className={`rounded-full px-3 py-0.5 text-[10px] uppercase font-bold ${
                              order.paymentStatus === "payment_verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.paymentStatus === "payment_claimed"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.paymentStatus.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-[#1f171a]">₹{order.totalAmount}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-[#1f171a]">{order.customerName}</p>
                          <p className="text-[#1f171a]/60">{order.customerPhone}</p>
                          {order.addressSnapshot && (
                            <p className="mt-1 text-[#1f171a]/70 line-clamp-2">{order.addressSnapshot}</p>
                          )}
                        </div>

                        {/* Status Progression Buttons */}
                        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                          <span className="text-[11px] text-[#1f171a]/50 uppercase tracking-[0.16em]">
                            Advance State:
                          </span>
                          {order.orderStatus === "pending_payment" && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "accepted" })}
                              className="rounded-full bg-[#d6a85e] px-4 py-1.5 text-xs font-semibold text-[#161016]"
                            >
                              Accept Order
                            </button>
                          )}
                          {order.orderStatus === "accepted" && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "preparing" })}
                              className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.orderStatus === "preparing" && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "ready" })}
                              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.orderStatus === "ready" && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "out_for_delivery" })}
                              className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white"
                            >
                              Dispatch Driver
                            </button>
                          )}
                          {order.orderStatus === "out_for_delivery" && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivered" })}
                              className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white"
                            >
                              Complete Order
                            </button>
                          )}
                          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                            <button
                              onClick={() => {
                                const reason = window.prompt("Reason for cancellation:", "Customer requested / Kitchen issue");
                                if (reason) updateStatusMutation.mutate({ id: order.id, status: "cancelled", notes: reason });
                              }}
                              className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#1f171a]/15 p-16 text-center text-xs text-[#1f171a]/60">
                  <ShoppingBag size={32} className="mx-auto text-[#9b684c]/60 mb-3" />
                  <p className="font-serif text-xl text-[#1f171a]">No orders in the live pipeline</p>
                  <p className="mt-1">New incoming customer orders will trigger an audible notification here.</p>
                </div>
              )}
            </div>
          )}

          {/* 2. UPI VERIFICATION QUEUE */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl">Payment Verification Desk</h2>
                <p className="text-xs text-[#1f171a]/60">
                  Review 12-digit UTR claims against your merchant bank statement before kitchen dispatch.
                </p>
              </div>

              {pendingPayments && pendingPayments.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pendingPayments.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-800 font-bold">
                            Order #{p.orderId}
                          </span>
                          <p className="font-mono text-2xl font-bold text-[#1f171a] mt-1">₹{p.amount}</p>
                        </div>
                        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                          Pending Verification
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-xs">
                        <p className="text-stone-500">Customer Claimed UTR:</p>
                        <p className="font-mono text-sm font-bold text-stone-900">{p.upiReference || "No UTR provided"}</p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => verifyPaymentMutation.mutate({ paymentId: p.id })}
                          className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-emerald-700 shadow"
                        >
                          Confirm & Accept
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt("Rejection reason:", "Credit not received in bank");
                            if (reason) rejectPaymentMutation.mutate({ paymentId: p.id, reason });
                          }}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#1f171a]/15 p-16 text-center text-xs text-[#1f171a]/60">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-3" />
                  <p className="font-serif text-xl text-[#1f171a]">All UPI claims reconciled</p>
                  <p className="mt-1">When customers submit 12-digit UTR numbers, they will appear here for staff verification.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. DASHBOARD KPIS */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl">Financial & Operational Metrics</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9b684c]">Today's Revenue</p>
                  <p className="mt-3 font-mono text-3xl font-bold text-[#1f171a]">₹{summary?.todayRevenue || "0.00"}</p>
                </div>
                <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9b684c]">Today's Volume</p>
                  <p className="mt-3 font-mono text-3xl font-bold text-[#1f171a]">{summary?.todayOrderCount || 0}</p>
                </div>
                <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9b684c]">In Kitchen Prep</p>
                  <p className="mt-3 font-mono text-3xl font-bold text-amber-600">{summary?.preparing || 0}</p>
                </div>
                <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9b684c]">On Delivery</p>
                  <p className="mt-3 font-mono text-3xl font-bold text-indigo-600">{summary?.outForDelivery || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. MENU CMS */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl">Menu Catalog CMS</h2>
                  <p className="text-xs text-[#1f171a]/60">
                    Manage dishes, high-resolution imagery, culinary descriptions, pricing, and live 86/availability.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-stone-150 px-3 py-1 text-xs font-mono font-medium text-stone-600 border border-stone-200">
                    {menuList?.length || 0} Total Dishes
                  </span>
                  <button
                    onClick={() => {
                      setDishError("");
                      setIsNewDishOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1f171a] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#9b684c] shadow transition"
                  >
                    <Plus size={14} /> Add New Dish
                  </button>
                </div>
              </div>

              {/* Status Notifications */}
              {dishSuccess && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 animate-fade-in shadow-sm">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <span className="font-medium">{dishSuccess}</span>
                </div>
              )}

              {dishError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                  <span className="font-medium">{dishError}</span>
                </div>
              )}

              {/* Add Dish Modal Form */}
              {isNewDishOpen && (
                <form
                  onSubmit={handleCreateDishSubmit}
                  className="rounded-3xl border border-[#1f171a]/15 bg-white p-6 sm:p-8 shadow-xl animate-fade-in space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#1f171a]">Add New Dish to Catalog</h3>
                      <p className="text-xs text-stone-500 mt-1">Dishes appear instantly across the customer storefront and kitchen display.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewDishOpen(false)}
                      className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>

                  {/* Top Details Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                    {/* Dish Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Dish Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newDish.name}
                        onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                        placeholder="e.g. Subz Miloni Handi"
                        required
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#9b684c] focus:outline-none transition"
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Menu Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newDish.categoryId}
                        onChange={e => setNewDish({ ...newDish, categoryId: Number(e.target.value) })}
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#9b684c] focus:outline-none bg-white transition"
                      >
                        {categories?.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Selling Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-stone-400 font-mono text-sm">₹</span>
                        <input
                          type="text"
                          value={newDish.price}
                          onChange={e => setNewDish({ ...newDish, price: e.target.value })}
                          placeholder="380"
                          required
                          className="w-full rounded-xl border border-stone-300 py-3 pl-8 pr-3 text-sm font-mono focus:border-[#9b684c] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Discounted Price */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Discount / Offer Price (₹) <span className="text-stone-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3 text-stone-400 font-mono text-sm">₹</span>
                        <input
                          type="text"
                          value={newDish.discountPrice}
                          onChange={e => setNewDish({ ...newDish, discountPrice: e.target.value })}
                          placeholder="e.g. 340"
                          className="w-full rounded-xl border border-stone-300 py-3 pl-8 pr-3 text-sm font-mono focus:border-[#9b684c] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Dietary Type */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Dietary Classification
                      </label>
                      <select
                        value={newDish.dietary}
                        onChange={e => setNewDish({ ...newDish, dietary: e.target.value as any })}
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#9b684c] focus:outline-none bg-white transition"
                      >
                        <option value="veg">🟢 Pure Vegetarian</option>
                        <option value="vegan">🌱 100% Vegan</option>
                        <option value="jain">☸ Jain Preparation (No Onion/Garlic)</option>
                        <option value="non_veg">🔴 Non-Vegetarian</option>
                        <option value="egg">🟡 Contains Egg</option>
                      </select>
                    </div>

                    {/* Spice Level */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Spice Level
                      </label>
                      <select
                        value={newDish.spiceLevel}
                        onChange={e => setNewDish({ ...newDish, spiceLevel: Number(e.target.value) })}
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#9b684c] focus:outline-none bg-white transition"
                      >
                        <option value={0}>Mild (No Heat)</option>
                        <option value={1}>Medium Spice 🌶</option>
                        <option value={2}>Hot 🌶🌶</option>
                        <option value={3}>Extra Hot 🌶🌶🌶</option>
                      </select>
                    </div>

                    {/* Preparation Time */}
                    <div>
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Prep Time (Minutes)
                      </label>
                      <div className="relative">
                        <Clock3 size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
                        <input
                          type="number"
                          min={5}
                          max={180}
                          value={newDish.prepTimeMinutes}
                          onChange={e => setNewDish({ ...newDish, prepTimeMinutes: Number(e.target.value) })}
                          placeholder="20"
                          className="w-full rounded-xl border border-stone-300 py-3 pl-9 pr-3 text-sm font-mono focus:border-[#9b684c] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Culinary Description */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-stone-700 uppercase font-semibold tracking-wider text-[11px] mb-1">
                        Culinary Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={newDish.description}
                        onChange={e => setNewDish({ ...newDish, description: e.target.value })}
                        placeholder="Slow-simmered handi preparation with fresh garden greens, fenugreek cream, roasted cumin, and cold-pressed mustard oil."
                        rows={3}
                        required
                        className="w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-[#9b684c] focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* IMAGE UPLOAD SECTION */}
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                          <ImageIcon size={16} className="text-[#9b684c]" />
                          Dish Photography & Presentation Image
                        </h4>
                        <p className="text-xs text-stone-500">
                          Upload high-resolution food photo directly from your device, or provide an image link.
                        </p>
                      </div>
                      {newDish.imageUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <Check size={12} /> Image Attached
                        </span>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 items-center">
                      {/* Upload Box */}
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer border-2 border-dashed border-stone-300 hover:border-[#9b684c] rounded-2xl p-6 text-center bg-white transition hover:bg-stone-50 flex flex-col items-center justify-center gap-2"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 size={24} className="animate-spin text-[#9b684c]" />
                              <span className="text-xs font-semibold text-stone-600">Uploading image to server...</span>
                            </>
                          ) : (
                            <>
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#9b684c]/10 text-[#9b684c]">
                                <UploadCloud size={20} />
                              </div>
                              <span className="text-xs font-bold text-stone-700">Click to Upload Dish Photo</span>
                              <span className="text-[11px] text-stone-400">Supports JPEG, PNG, WebP up to 4MB</span>
                            </>
                          )}
                        </div>

                        {/* URL Manual Input Fallback */}
                        <div className="mt-3">
                          <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                            Or paste image URL (or uploaded path)
                          </label>
                          <input
                            type="text"
                            value={newDish.imageUrl}
                            onChange={e => {
                              setNewDish({ ...newDish, imageUrl: e.target.value });
                              setImagePreview(e.target.value);
                            }}
                            placeholder="https://... or /uploads/..."
                            className="w-full rounded-xl border border-stone-300 p-2 text-xs bg-white focus:border-[#9b684c] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Image Preview Window */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-44 w-full rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden relative shadow-inner flex items-center justify-center">
                          {imagePreview || newDish.imageUrl ? (
                            <>
                              <img
                                src={imagePreview || newDish.imageUrl}
                                alt="Dish preview"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview("");
                                  setNewDish({ ...newDish, imageUrl: "" });
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black transition"
                                title="Remove photo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon size={32} className="mx-auto text-stone-300 mb-2" />
                              <p className="text-xs text-stone-400">Photo preview will appear here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights and Badges */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-stone-700">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newDish.isBestseller}
                        onChange={e => setNewDish({ ...newDish, isBestseller: e.target.checked })}
                        className="h-4 w-4 rounded text-[#9b684c] focus:ring-[#9b684c]"
                      />
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles size={13} className="text-amber-500" /> Bestseller Dish
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newDish.isFeatured}
                        onChange={e => setNewDish({ ...newDish, isFeatured: e.target.checked })}
                        className="h-4 w-4 rounded text-[#9b684c] focus:ring-[#9b684c]"
                      />
                      <span className="font-semibold flex items-center gap-1">
                        <Flame size={13} className="text-rose-500" /> Featured on Homepage
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-5">
                    <button
                      type="button"
                      onClick={() => setIsNewDishOpen(false)}
                      className="rounded-full border border-stone-300 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMenuItemMutation.isPending || isUploadingImage}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1f171a] px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#9b684c] disabled:opacity-50 transition shadow-lg"
                    >
                      {createMenuItemMutation.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Saving Dish...
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Publish Dish to Menu
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Dish List Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {menuList?.map(dish => {
                  const categoryName = categories?.find(c => c.id === dish.categoryId)?.name || "Dish";
                  return (
                    <div
                      key={dish.id}
                      className="rounded-3xl border border-[#1f171a]/10 bg-white overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition"
                    >
                      {/* Card Media Header */}
                      <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-stone-300">
                            <ImageIcon size={36} />
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-[#161016]/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#f8f1e8]">
                            {categoryName}
                          </span>
                          {dish.dietary === "veg" && (
                            <span className="rounded-full bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                              Veg
                            </span>
                          )}
                          {dish.dietary === "non_veg" && (
                            <span className="rounded-full bg-rose-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                              Non-Veg
                            </span>
                          )}
                          {dish.dietary === "vegan" && (
                            <span className="rounded-full bg-teal-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                              Vegan
                            </span>
                          )}
                          {dish.dietary === "jain" && (
                            <span className="rounded-full bg-amber-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                              Jain
                            </span>
                          )}
                        </div>

                        {dish.isBestseller && (
                          <div className="absolute top-3 right-3 rounded-full bg-[#d6a85e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#161016] shadow">
                            Bestseller
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif text-lg font-bold text-[#1f171a] leading-tight">
                              {dish.name}
                            </h4>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-base text-[#9b684c]">
                                ₹{dish.price}
                              </span>
                              {dish.discountPrice && (
                                <span className="block font-mono text-xs text-stone-400 line-through">
                                  ₹{dish.discountPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>

                          <div className="mt-3 flex items-center gap-3 text-[11px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock3 size={12} /> {dish.prepTimeMinutes || 20}m prep
                            </span>
                            {dish.spiceLevel > 0 && (
                              <span className="flex items-center gap-1 text-rose-500">
                                <Flame size={12} /> Level {dish.spiceLevel}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Controls */}
                        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                          <button
                            onClick={() =>
                              updateMenuItemMutation.mutate({ id: dish.id, isAvailable: !dish.isAvailable })
                            }
                            className={`rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                              dish.isAvailable
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {dish.isAvailable ? "● In Stock (Live)" : "○ Sold Out (86'd)"}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDishError("");
                                setEditingDish({
                                  id: dish.id,
                                  name: dish.name,
                                  description: dish.description,
                                  categoryId: dish.categoryId,
                                  price: String(dish.price),
                                  discountPrice: dish.discountPrice ? String(dish.discountPrice) : "",
                                  dietary: (dish.dietary as any) || "veg",
                                  spiceLevel: dish.spiceLevel || 0,
                                  prepTimeMinutes: dish.prepTimeMinutes || 20,
                                  imageUrl: dish.imageUrl || "",
                                  isFeatured: Boolean(dish.isFeatured),
                                  isBestseller: Boolean(dish.isBestseller),
                                  isAvailable: Boolean(dish.isAvailable),
                                });
                                setEditImagePreview(dish.imageUrl || "");
                              }}
                              className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-[#9b684c] transition"
                              title="Edit dish"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove "${dish.name}" from the catalog?`)) {
                                  deleteMenuItemMutation.mutate({ id: dish.id });
                                }
                              }}
                              className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete dish"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* EDIT DISH MODAL */}
              {editingDish && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
                  <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#9b684c]">Menu CMS</span>
                        <h3 className="font-serif text-2xl font-bold text-[#1f171a]">Edit Dish: {editingDish.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingDish(null)}
                        className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>

                    {dishError && (
                      <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{dishError}</span>
                      </div>
                    )}

                    <form onSubmit={handleUpdateDishSubmit} className="mt-6 space-y-5">
                      {/* Name & Category */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Dish Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editingDish.name}
                            onChange={e => setEditingDish({ ...editingDish, name: e.target.value })}
                            required
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Menu Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editingDish.categoryId}
                            onChange={e => setEditingDish({ ...editingDish, categoryId: Number(e.target.value) })}
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          >
                            {categories?.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Regular Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editingDish.price}
                            onChange={e => setEditingDish({ ...editingDish, price: e.target.value })}
                            required
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Special Discount Price (₹, optional)
                          </label>
                          <input
                            type="text"
                            value={editingDish.discountPrice}
                            onChange={e => setEditingDish({ ...editingDish, discountPrice: e.target.value })}
                            placeholder="Leave empty for no discount"
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Culinary Description */}
                      <div>
                        <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                          Culinary Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={editingDish.description}
                          onChange={e => setEditingDish({ ...editingDish, description: e.target.value })}
                          required
                          className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                        />
                      </div>

                      {/* Dietary & Prep Time */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Dietary Preference
                          </label>
                          <select
                            value={editingDish.dietary}
                            onChange={e => setEditingDish({ ...editingDish, dietary: e.target.value as any })}
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          >
                            <option value="veg">Pure Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="jain">Jain (No Root Veg)</option>
                            <option value="non_veg">Non-Vegetarian</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Prep Time (Mins)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            value={editingDish.prepTimeMinutes}
                            onChange={e => setEditingDish({ ...editingDish, prepTimeMinutes: Number(e.target.value) })}
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-semibold text-stone-600 mb-1">
                            Spice Level (0-3)
                          </label>
                          <select
                            value={editingDish.spiceLevel}
                            onChange={e => setEditingDish({ ...editingDish, spiceLevel: Number(e.target.value) })}
                            className="w-full rounded-xl border border-stone-300 p-2.5 text-sm bg-white focus:border-[#9b684c] focus:outline-none"
                          >
                            <option value="0">0 - Mild / No Chili</option>
                            <option value="1">1 - Gentle Warmth</option>
                            <option value="2">2 - Medium Spicy</option>
                            <option value="3">3 - Hot Tandoori Fire</option>
                          </select>
                        </div>
                      </div>

                      {/* Photography Section */}
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <label className="block text-xs uppercase font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                          <ImageIcon size={15} className="text-[#9b684c]" />
                          Dish Photography
                        </label>

                        <input
                          type="file"
                          ref={editFileInputRef}
                          onChange={handleEditImageFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />

                        <div className="grid sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <div
                              onClick={() => editFileInputRef.current?.click()}
                              className="cursor-pointer border-2 border-dashed border-stone-300 hover:border-[#9b684c] rounded-2xl p-4 text-center bg-white transition hover:bg-stone-50 flex flex-col items-center justify-center gap-1.5"
                            >
                              {isEditingUploading ? (
                                <>
                                  <Loader2 size={20} className="animate-spin text-[#9b684c]" />
                                  <span className="text-xs font-semibold text-stone-600">Uploading new photo...</span>
                                </>
                              ) : (
                                <>
                                  <UploadCloud size={20} className="text-[#9b684c]" />
                                  <span className="text-xs font-bold text-stone-700">Upload New Photo</span>
                                  <span className="text-[10px] text-stone-400">JPEG, PNG, WebP up to 4MB</span>
                                </>
                              )}
                            </div>

                            <div className="mt-2">
                              <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                                Or image URL (/uploads/... or https://...)
                              </label>
                              <input
                                type="text"
                                value={editingDish.imageUrl}
                                onChange={e => {
                                  setEditingDish({ ...editingDish, imageUrl: e.target.value });
                                  setEditImagePreview(e.target.value);
                                }}
                                placeholder="https://... or /uploads/..."
                                className="w-full rounded-xl border border-stone-300 p-2 text-xs bg-white focus:border-[#9b684c] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="h-36 w-full rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden relative shadow-inner flex items-center justify-center">
                            {editImagePreview || editingDish.imageUrl ? (
                              <>
                                <img
                                  src={editImagePreview || editingDish.imageUrl}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditImagePreview("");
                                    setEditingDish({ ...editingDish, imageUrl: "" });
                                    if (editFileInputRef.current) editFileInputRef.current.value = "";
                                  }}
                                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black transition"
                                  title="Remove photo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-3 text-stone-400">
                                <ImageIcon size={28} className="mx-auto mb-1 text-stone-300" />
                                <span className="text-xs">No image attached</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-stone-700">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editingDish.isBestseller}
                            onChange={e => setEditingDish({ ...editingDish, isBestseller: e.target.checked })}
                            className="h-4 w-4 rounded text-[#9b684c] focus:ring-[#9b684c]"
                          />
                          <span className="font-semibold flex items-center gap-1">
                            <Sparkles size={13} className="text-amber-500" /> Bestseller
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editingDish.isFeatured}
                            onChange={e => setEditingDish({ ...editingDish, isFeatured: e.target.checked })}
                            className="h-4 w-4 rounded text-[#9b684c] focus:ring-[#9b684c]"
                          />
                          <span className="font-semibold flex items-center gap-1">
                            <Flame size={13} className="text-rose-500" /> Featured on Homepage
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editingDish.isAvailable}
                            onChange={e => setEditingDish({ ...editingDish, isAvailable: e.target.checked })}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-600"
                          />
                          <span className="font-semibold">
                            {editingDish.isAvailable ? "In Stock (Available)" : "Sold Out"}
                          </span>
                        </label>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingDish(null)}
                          className="rounded-full border border-stone-300 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateMenuItemMutation.isPending || isEditingUploading}
                          className="inline-flex items-center gap-2 rounded-full bg-[#1f171a] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#9b684c] disabled:opacity-50 transition shadow"
                        >
                          {updateMenuItemMutation.isPending ? (
                            <>
                              <Loader2 size={14} className="animate-spin" /> Saving Changes...
                            </>
                          ) : (
                            "Save Dish Changes"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. RESTAURANT SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <h2 className="font-serif text-2xl">Operational Configuration</h2>
              <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-6 shadow-sm space-y-4 text-xs">
                <div>
                  <label className="block text-stone-600 uppercase font-semibold">Restaurant Name</label>
                  <input
                    type="text"
                    defaultValue={settings?.restaurantName}
                    onBlur={(e) => updateSettingsMutation.mutate({ restaurantName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 uppercase font-semibold">Direct UPI ID (VPA)</label>
                  <input
                    type="text"
                    defaultValue={settings?.upiId}
                    onBlur={(e) => updateSettingsMutation.mutate({ upiId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-600 uppercase font-semibold">Packaging Fee (₹)</label>
                    <input
                      type="text"
                      defaultValue={settings?.packagingFee}
                      onBlur={(e) => updateSettingsMutation.mutate({ packagingFee: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 uppercase font-semibold">Base Delivery Fee (₹)</label>
                    <input
                      type="text"
                      defaultValue={settings?.baseDeliveryFee}
                      onBlur={(e) => updateSettingsMutation.mutate({ baseDeliveryFee: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-600 uppercase font-semibold">Free Delivery Threshold (₹)</label>
                  <input
                    type="text"
                    defaultValue={settings?.freeDeliveryThreshold}
                    onBlur={(e) => updateSettingsMutation.mutate({ freeDeliveryThreshold: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. RESERVATIONS */}
          {activeTab === "reservations" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl">Table Reservation Requests</h2>
              <div className="divide-y divide-stone-100 rounded-2xl border border-[#1f171a]/10 bg-white">
                {reservations?.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-sm text-[#1f171a]">{r.guestName}</p>
                      <p className="text-stone-500">
                        {r.partySize} Guests · {r.reservationDate} at {r.reservationTime} · Phone: {r.phone}
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl">Immutable Administrative Audit Trail</h2>
              <div className="divide-y divide-stone-100 rounded-2xl border border-[#1f171a]/10 bg-white">
                {auditLogs?.map((log) => (
                  <div key={log.id} className="p-4 text-xs">
                    <div className="flex justify-between font-mono text-[11px] text-stone-400">
                      <span>Action: {log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-stone-700">
                      Resource: <strong className="font-mono">{log.resource}</strong> (#{log.resourceId || "N/A"})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. TEAM & STAFF MANAGEMENT */}
          {activeTab === "staff" && (
            <div className="space-y-8">
              {/* Staff Roster */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-serif text-2xl">Staff & Delivery Personnel</h2>
                    <p className="text-xs text-[#1f171a]/60">
                      Manage authorized kitchen operators, order dispatchers, and delivery fleet drivers.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewMemberOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1f171a] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-stone-800"
                  >
                    <UserPlus size={14} /> Add Team Member
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#1f171a]/10 bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                      <tr>
                        <th className="px-5 py-3">Member Name</th>
                        <th className="px-5 py-3">Assigned Role</th>
                        <th className="px-5 py-3">Contact Phone</th>
                        <th className="px-5 py-3">Login Identifier</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {teamMembers?.map((m) => (
                        <tr key={m.id} className="hover:bg-stone-50/60 transition">
                          <td className="px-5 py-3.5 font-semibold text-[#1f171a]">{m.name}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                m.role === "owner"
                                  ? "bg-purple-100 text-purple-800"
                                  : m.role === "order_staff"
                                  ? "bg-blue-100 text-blue-800"
                                  : m.role === "driver"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {m.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-stone-600">{m.phone || "—"}</td>
                          <td className="px-5 py-3.5 font-mono text-stone-500 text-[11px]">{m.authUserId}</td>
                          <td className="px-5 py-3.5 text-right">
                            {m.role !== "owner" && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remove ${m.name} from staff?`)) {
                                    removeMemberMutation.mutate({ id: m.id });
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 font-semibold text-[11px]"
                              >
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Staff Modal */}
              {isNewMemberOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-[#1f171a]">
                    <h3 className="font-serif text-xl">Provision New Team Member</h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Create credentials for kitchen operators or delivery fleet drivers.
                    </p>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMember.name || !newMember.phone) return;
                        createMemberMutation.mutate(newMember);
                      }}
                      className="mt-4 space-y-3"
                    >
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          required
                          className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Mobile Phone *
                        </label>
                        <input
                          type="tel"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                          placeholder="10-digit phone number"
                          required
                          className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Assigned Operational Role
                        </label>
                        <select
                          value={newMember.role}
                          onChange={(e) => setNewMember({ ...newMember, role: e.target.value as any })}
                          className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                        >
                          <option value="order_staff">Kitchen Order Staff (Live Queue Operations)</option>
                          <option value="driver">Delivery Driver (Live GPS Dispatch /driver)</option>
                          <option value="manager">Restaurant Manager</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Initial Password
                        </label>
                        <input
                          type="password"
                          value={newMember.password}
                          onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                          placeholder="e.g. Staff@2026"
                          className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                        />
                      </div>

                      <div className="mt-5 flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsNewMemberOpen(false)}
                          className="rounded-full px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createMemberMutation.isPending}
                          className="rounded-full bg-[#1f171a] px-5 py-2 text-xs font-semibold text-white shadow hover:bg-stone-800 disabled:opacity-50"
                        >
                          {createMemberMutation.isPending ? "Adding..." : "Save Team Member"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Password Management Card */}
              <div className="rounded-2xl border border-[#1f171a]/10 bg-white p-6 shadow-sm max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-800">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg">Change Administrator Password</h3>
                    <p className="text-xs text-stone-500">
                      Update your primary administrative password for accessing the operations console.
                    </p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                    <CheckCircle2 size={15} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                    <AlertCircle size={15} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newAdminPassword || newAdminPassword.length < 6) {
                      setPasswordError("New password must be at least 6 characters.");
                      return;
                    }
                    changePasswordMutation.mutate({
                      currentPassword: currentAdminPassword || undefined,
                      newPassword: newAdminPassword,
                    });
                  }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentAdminPassword}
                      onChange={(e) => setCurrentAdminPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      New Administrator Password
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full rounded-xl border border-stone-300 p-2.5 text-xs focus:border-[#1f171a] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="rounded-full bg-[#1f171a] px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-stone-800 disabled:opacity-50 mt-1"
                  >
                    {changePasswordMutation.isPending ? "Updating Password..." : "Update Administrator Password"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
