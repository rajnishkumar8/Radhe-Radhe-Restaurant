import React, { useState, useEffect } from "react";
import { X, User, Phone, Mail, Lock, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "register";
}

export function CustomerAuthModal({ isOpen, onClose, initialMode = "signin" }: CustomerAuthModalProps) {
  const { data: user, refetch: refetchUser } = trpc.auth.me.useQuery();
  const [mode, setMode] = useState<"signin" | "register">(initialMode);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, isOpen]);

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const loginMutation = trpc.auth.customerLogin.useMutation({
    onSuccess: data => {
      if (data?.token) {
        try {
          localStorage.setItem("app_session_token", data.token);
        } catch {}
      }
      setSuccessMsg("Welcome back! Signed in successfully.");
      setErrorMsg("");
      refetchUser();
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1000);
    },
    onError: err => {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
      setSuccessMsg("");
    },
  });

  const registerMutation = trpc.auth.customerRegister.useMutation({
    onSuccess: data => {
      if (data?.token) {
        try {
          localStorage.setItem("app_session_token", data.token);
        } catch {}
      }
      setSuccessMsg("Account created successfully! Welcome to Shri Radhe Radhe.");
      setErrorMsg("");
      refetchUser();
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1200);
    },
    onError: err => {
      setErrorMsg(err.message || "Failed to register. Please check your details.");
      setSuccessMsg("");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        localStorage.removeItem("app_session_token");
      } catch {}
      refetchUser();
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#1e151d] p-6 sm:p-8 text-[#f8f1e8] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        {user ? (
          // Authenticated State View
          <div className="text-center py-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d6a85e]/20 text-[#f4d59b] border border-[#d6a85e]/40">
              <User size={30} />
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d6a85e]">
              Diner Account
            </p>
            <h3 className="mt-1 font-serif text-2xl text-white">{user.name || "Valued Guest"}</h3>
            <p className="text-xs text-white/60 mt-1">{user.phone || user.email || "Signed In"}</p>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href="/profile"
                onClick={onClose}
                className="w-full rounded-full bg-[#d6a85e] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] transition hover:bg-[#e4be7b]"
              >
                View Orders & Profile
              </a>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 py-2.5 text-xs text-white/80 hover:bg-white/10"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          // Guest Authentication View
          <div>
            <div className="text-center mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d6a85e]">
                Shri Radhe Radhe Restaurant
              </p>
              <h3 className="mt-1 font-serif text-2xl text-white">
                {mode === "signin" ? "Sign In to Your Account" : "Join Our Culinary Circle"}
              </h3>
              <p className="mt-1 text-xs text-white/60">
                {mode === "signin"
                  ? "Track your deliveries, save favorite plates & earn loyalty rewards."
                  : "Create an account for seamless ordering and dining reservations."}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-full bg-white/5 p-1 border border-white/10 mb-5">
              <button
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-full transition ${
                  mode === "signin"
                    ? "bg-[#d6a85e] text-[#161016] font-semibold shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-full transition ${
                  mode === "register"
                    ? "bg-[#d6a85e] text-[#161016] font-semibold shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 p-3 text-xs text-emerald-200">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === "signin" ? (
              // Sign In Form
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!signInIdentifier.trim()) {
                    setErrorMsg("Please enter your phone number or email address.");
                    return;
                  }
                  loginMutation.mutate({
                    identifier: signInIdentifier,
                    password: signInPassword || undefined,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={e => setSignInIdentifier(e.target.value)}
                      placeholder="+91 98290 12345 or user@example.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Password <span className="text-white/40 lowercase">(optional if new guest)</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-full bg-[#d6a85e] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] transition hover:bg-[#e4be7b] disabled:opacity-50 shadow-lg mt-2"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In to Order"}
                </button>

                {/* Quick 1-Click Customer Demo Login */}
                <div className="border-t border-white/10 pt-4 text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSignInIdentifier("+919829012345");
                      loginMutation.mutate({ identifier: "+919829012345" });
                    }}
                    className="block w-full text-[11px] text-[#f4d59b] hover:underline"
                  >
                    Quick Sign In as Radha Gupta (Diner)
                  </button>
                  <p className="text-xs text-white/50">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setErrorMsg("");
                      }}
                      className="font-semibold text-[#f4d59b] underline hover:text-white"
                    >
                      Sign Up here
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              // Register Form
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!regName.trim() || !regPhone.trim()) {
                    setErrorMsg("Name and phone number are required.");
                    return;
                  }
                  registerMutation.mutate({
                    name: regName,
                    phone: regPhone,
                    email: regEmail || undefined,
                    password: regPassword || undefined,
                  });
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Radha Gupta"
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Email Address <span className="text-white/40">(optional, for invoices)</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="radha@example.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full rounded-full bg-[#d6a85e] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#161016] transition hover:bg-[#e4be7b] disabled:opacity-50 shadow-lg mt-2"
                >
                  {registerMutation.isPending ? "Creating account..." : "Complete Registration"}
                </button>

                <div className="mt-3 text-center text-xs text-white/50">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg("");
                    }}
                    className="font-semibold text-[#f4d59b] underline hover:text-white"
                  >
                    Sign In here
                  </button>
                </div>
              </form>
            )}

            {/* Discrete Footer for Operations Staff */}
            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <p className="text-[10px] text-white/40">
                Restaurant staff or delivery partner?{" "}
                <a href="/admin" onClick={onClose} className="text-[#f4d59b] hover:underline">
                  Staff Console
                </a>{" "}
                |{" "}
                <a href="/driver" onClick={onClose} className="text-[#f4d59b] hover:underline">
                  Driver Portal
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
