import { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
  const { data: user } = trpc.auth.me.useQuery();
  const reserveMutation = trpc.customer.reserve.useMutation();

  const [form, setForm] = useState({
    guestName: "",
    phone: "",
    email: "",
    partySize: 2,
    reservationDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    reservationTime: "19:30",
    notes: "",
  });

  // Pre-fill form with logged-in user's info
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        guestName: prev.guestName || user.name || "",
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.guestName.trim().length < 2) {
      setError("Please provide your full name.");
      return;
    }

    const cleanPhone = form.phone.replace(/[^0-9+]/g, "");
    if (!/^\+?[0-9]{10,14}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-14 digit mobile number.");
      return;
    }

    // Check Monday closure (restaurant is closed on Mondays)
    if (form.reservationDate) {
      const [year, month, day] = form.reservationDate.split("-").map(Number);
      const selectedDate = new Date(year, month - 1, day);
      if (selectedDate.getDay() === 1) {
        setError("Shri Radhe Radhe Restaurant is closed on Mondays for kitchen sanitization and maintenance. Please select Tuesday through Sunday.");
        return;
      }
    }

    try {
      await reserveMutation.mutateAsync({
        guestName: form.guestName.trim(),
        phone: cleanPhone,
        email: form.email.trim() || undefined,
        partySize: Number(form.partySize),
        reservationDate: form.reservationDate,
        reservationTime: form.reservationTime,
        notes: form.notes.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit reservation request. Please call the restaurant directly.");
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError("");
    setForm({
      guestName: "",
      phone: "",
      email: "",
      partySize: 2,
      reservationDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      reservationTime: "19:30",
      notes: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#251925]/15 bg-[#f3eadf] p-7 text-[#251925] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[#251925]/15 text-[#251925]/70 transition hover:bg-[#251925]/10 hover:text-[#251925]"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto text-[#4e7b56]" size={42} />
            <h3 className="mt-4 font-serif text-3xl">Table Requested</h3>
            <p className="mt-3 text-sm text-[#6e3d2d]/80 leading-relaxed">
              Thank you, <strong>{form.guestName}</strong>. We have received your request for{" "}
              <strong>{form.partySize} guests</strong> on <strong>{form.reservationDate}</strong> at{" "}
              <strong>{form.reservationTime}</strong>.
            </p>
            <p className="mt-2 text-xs text-[#6e3d2d]/60">Our dining manager will phone you shortly to confirm table availability.</p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-full bg-[#251925] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#6e3d2d]"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#9b684c]">A seat at our table</p>
            <h2 className="mt-2 font-serif text-4xl">Reserve a table</h2>
            <p className="mt-1 text-xs text-[#6e3d2d]/70">We welcome walk-ins, but reservations ensure an unhurried evening.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.16em] text-[#6e3d2d]/80">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  placeholder="e.g. Radhika Mehra"
                  className="mt-1 w-full rounded-xl border border-[#251925]/20 bg-white/50 px-4 py-2.5 text-sm text-[#251925] outline-none placeholder:text-[#6e3d2d]/40 focus:border-[#9b684c] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.16em] text-[#6e3d2d]/80">Phone Number (For confirmation call)</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full rounded-xl border border-[#251925]/20 bg-white/50 px-4 py-2.5 text-sm text-[#251925] outline-none placeholder:text-[#6e3d2d]/40 focus:border-[#9b684c] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#6e3d2d]/80">
                    <Calendar size={12} /> Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={form.reservationDate}
                    onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#251925]/20 bg-white/50 px-3 py-2 text-xs text-[#251925] outline-none focus:border-[#9b684c] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#6e3d2d]/80">
                    <Clock size={12} /> Time
                  </label>
                  <select
                    value={form.reservationTime}
                    onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#251925]/20 bg-white/50 px-3 py-2 text-xs text-[#251925] outline-none focus:border-[#9b684c] focus:bg-white"
                  >
                    <option value="12:30">12:30 PM (Lunch)</option>
                    <option value="13:30">1:30 PM (Lunch)</option>
                    <option value="19:00">7:00 PM (Dinner)</option>
                    <option value="19:30">7:30 PM (Dinner)</option>
                    <option value="20:00">8:00 PM (Dinner)</option>
                    <option value="20:30">8:30 PM (Dinner)</option>
                    <option value="21:00">9:00 PM (Dinner)</option>
                    <option value="21:30">9:30 PM (Late Dinner)</option>
                    <option value="22:00">10:00 PM (Late Dinner)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#6e3d2d]/80">
                  <Users size={12} /> Guests
                </label>
                <select
                  value={form.partySize}
                  onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-[#251925]/20 bg-white/50 px-3 py-2 text-xs text-[#251925] outline-none focus:border-[#9b684c] focus:bg-white"
                >
                  <option value={2}>2 Guests (Intimate table)</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests (Family table)</option>
                  <option value={6}>6 Guests (Large gathering)</option>
                  <option value={8}>8+ Guests (Celebration dining)</option>
                </select>
              </div>

              {error && <p className="text-xs text-[#b44d3d] font-medium">{error}</p>}

              <button
                type="submit"
                disabled={reserveMutation.isPending}
                className="mt-4 w-full rounded-full bg-[#251925] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#6e3d2d] disabled:opacity-50"
              >
                {reserveMutation.isPending ? "Submitting…" : "Request Table"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
