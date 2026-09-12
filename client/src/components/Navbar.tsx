import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, ShoppingBag, Menu, X, UserRound, Shield, Bike, ChefHat, LogOut, ChevronDown, User, ClipboardList } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { ReservationModal } from "./ReservationModal";
import { CustomerAuthModal } from "./CustomerAuthModal";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { itemCount, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: user, refetch: refetchUser } = trpc.auth.me.useQuery();
  const isStaff = Boolean(user && ["owner", "manager", "order_staff", "admin"].includes(user.role));
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetchUser();
      setAccountDropdownOpen(false);
      navigate("/");
    },
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#161016]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-10">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#d6a85e]/60 text-[#d6a85e] transition-transform duration-300 group-hover:rotate-12">
              <Sparkles size={17} />
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-[0.18em] text-white">RADHE RADHE</span>
              <span className="text-[9px] uppercase tracking-[0.24em] text-[#d6a85e]">Darbhanga · Fine Dining</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.24em] text-white/70 md:flex">
            <Link
              href="/"
              className={`transition-colors hover:text-[#d6a85e] ${location === "/" ? "text-[#d6a85e]" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              className={`transition-colors hover:text-[#d6a85e] ${location === "/menu" ? "text-[#d6a85e]" : ""}`}
            >
              Menu
            </Link>
            <Link
              href="/celebrate"
              className={`transition-colors hover:text-[#d6a85e] ${location === "/celebrate" ? "text-[#d6a85e]" : ""}`}
            >
              Celebrations
            </Link>
            <a href="/#story" className="transition-colors hover:text-[#d6a85e]">
              Story
            </a>
            <a href="/#visit" className="transition-colors hover:text-[#d6a85e]">
              Visit & Hours
            </a>
            {isStaff && (
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-[#d6a85e] font-semibold border border-[#d6a85e]/40 rounded-full px-3 py-1 bg-[#d6a85e]/10">
                <ChefHat size={13} /> Admin Console
              </Link>
            )}
            {user?.role === "driver" && (
              <Link href="/driver" className="inline-flex items-center gap-1 text-emerald-400 font-semibold border border-emerald-500/40 rounded-full px-3 py-1 bg-emerald-500/10">
                <Bike size={13} /> Driver Portal
              </Link>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Reserve CTA for regular guests only */}
            {!isStaff && (
              <button
                onClick={() => setReserveModalOpen(true)}
                className="hidden sm:inline-flex rounded-full border border-[#d6a85e]/50 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f4d59b] transition hover:bg-[#d6a85e] hover:text-[#161016]"
              >
                Reserve Table
              </button>
            )}

            {/* Authentication / Account Buttons */}
            {user ? (
              <div className="relative hidden lg:block" ref={dropdownRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] text-white/90 hover:border-[#d6a85e] hover:text-white transition"
                >
                  <UserRound size={13} className="text-[#d6a85e]" />
                  <span>{user.name?.split(" ")[0] || "Account"}</span>
                  {isStaff && (
                    <span className="rounded-full bg-[#d6a85e]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#d6a85e] uppercase">
                      Staff
                    </span>
                  )}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${accountDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/15 bg-[#211721] p-2 text-xs text-white shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <p className="font-semibold text-white truncate">{user.name || "Customer"}</p>
                      <p className="text-[10px] text-white/50 truncate">{user.phone || user.email || ""}</p>
                      <span className="mt-1 inline-block rounded-full bg-[#d6a85e]/15 px-2 py-0.5 text-[9px] font-medium text-[#d6a85e] uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        <ClipboardList size={14} className="text-[#d6a85e]" />
                        <span>Order History & Profile</span>
                      </Link>

                      {isStaff && (
                        <Link
                          href="/admin"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          <ChefHat size={14} className="text-[#d6a85e]" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      {user.role === "driver" && (
                        <Link
                          href="/driver"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          <Bike size={14} className="text-emerald-400" />
                          <span>Driver Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-1">
                      <button
                        onClick={() => logout.mutate()}
                        disabled={logout.isPending}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut size={14} />
                        <span>{logout.isPending ? "Signing out…" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthModalOpen(true);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] text-white/90 hover:border-[#d6a85e] hover:text-white transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthModalOpen(true);
                  }}
                  className="rounded-full bg-[#d6a85e] px-3.5 py-1.5 text-[11px] font-semibold text-[#161016] hover:bg-[#e4be7b] transition shadow"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Cart Button for diners, or Admin Console quick access for owner/staff */}
            {isStaff ? (
              <Link
                href="/admin"
                className="relative hidden sm:inline-flex items-center gap-2 rounded-full bg-[#d6a85e] px-4 py-2.5 text-xs font-semibold text-[#161016] transition hover:bg-[#e4be7b] shadow-md active:scale-95"
              >
                <ChefHat size={16} />
                <span>Operations</span>
              </Link>
            ) : (
              <button
                aria-label="Open cart"
                onClick={openCart}
                className="relative grid h-11 w-11 place-items-center rounded-full bg-[#f3eadf] text-[#161016] transition duration-200 hover:bg-[#d6a85e] active:scale-95 shadow-md"
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#c4583f] text-[10px] font-semibold text-white shadow">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="grid h-11 w-11 place-items-center text-white md:hidden"
              aria-label="Open mobile menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#161016] px-6 py-6 md:hidden animate-fade-in">
            <div className="flex flex-col gap-4 text-xs uppercase tracking-[0.22em] text-white/80">
              <Link onClick={() => setMobileMenuOpen(false)} href="/">
                Home
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/menu">
                Menu & Catalog
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/celebrate">
                Celebrations & Banquets
              </Link>
              <a onClick={() => setMobileMenuOpen(false)} href="/#story">
                Our Story
              </a>
              <a onClick={() => setMobileMenuOpen(false)} href="/#visit">
                Visit & Contact
              </a>
              <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                {isStaff ? (
                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/admin"
                    className="w-full rounded-full bg-[#d6a85e] py-2.5 text-center text-[#161016] font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <ChefHat size={14} /> Go to Admin Console
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setReserveModalOpen(true);
                    }}
                    className="w-full rounded-full border border-[#d6a85e]/40 py-2.5 text-center text-[#f4d59b]"
                  >
                    Reserve Table
                  </button>
                )}
                {user ? (
                  <div className="space-y-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                      <p className="font-semibold text-white text-xs">{user.name || "Customer"}</p>
                      <p className="text-[10px] text-white/50">{user.phone || user.email || ""}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full rounded-full bg-white/10 py-2.5 text-center text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <ClipboardList size={13} className="text-[#d6a85e]" /> My Orders & Profile
                    </Link>
                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full rounded-full bg-[#d6a85e]/20 text-[#d6a85e] py-2 text-center text-xs font-semibold inline-flex items-center justify-center gap-2 border border-[#d6a85e]/40"
                      >
                        <ChefHat size={13} /> Admin Console
                      </Link>
                    )}
                    {user.role === "driver" && (
                      <Link
                        href="/driver"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full rounded-full bg-emerald-500/20 text-emerald-400 py-2 text-center text-xs font-semibold inline-flex items-center justify-center gap-2 border border-emerald-500/40"
                      >
                        <Bike size={13} /> Driver Portal
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout.mutate();
                      }}
                      className="w-full rounded-full border border-red-500/30 bg-red-500/10 py-2 text-center text-red-400 text-xs font-semibold inline-flex items-center justify-center gap-2"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthMode("signin");
                        setAuthModalOpen(true);
                      }}
                      className="w-full rounded-full bg-white/10 py-2.5 text-center text-white text-xs font-semibold"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthMode("register");
                        setAuthModalOpen(true);
                      }}
                      className="w-full rounded-full bg-[#d6a85e] py-2.5 text-center text-[#161016] text-xs font-semibold"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Table Reservation Modal */}
      <ReservationModal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
      />

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
