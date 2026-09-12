import { useState } from "react";
import { Link } from "wouter";
import {
  Sparkles,
  Calendar,
  Users,
  Clock,
  Heart,
  Award,
  CheckCircle2,
  Phone,
  MessageCircle,
  ChevronRight,
  Utensils,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { toast } from "sonner";

const CELEBRATION_TYPES = [
  {
    id: "birthday",
    title: "Birthday Galas",
    badge: "Most Popular",
    desc: "Bespoke marigold & light decor, celebratory dessert platters, and joyful banqueting for all ages.",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
    minGuests: "4 - 80 Guests",
  },
  {
    id: "anniversary",
    title: "Anniversaries & Milestones",
    badge: "Royal Experience",
    desc: "Intimate candlelit ambiance, slow-simmered live tandoor delicacies, and personalized table hospitality.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    minGuests: "2 - 60 Guests",
  },
  {
    id: "spiritual",
    title: "Sattvik & Spiritual Feasts",
    badge: "100% Pure Veg",
    desc: "Reverent dining for pujas, upanayana, and satsangs. Strictly no onion/garlic menus prepared on request.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80",
    minGuests: "10 - 150 Guests",
  },
  {
    id: "corporate",
    title: "Corporate & Team Dinners",
    badge: "Seamless Service",
    desc: "Pre-set executive banquets, quiet private corners, audio support, and effortless group billing.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
    minGuests: "8 - 50 Guests",
  },
];

export default function CelebratePage() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: settings } = trpc.restaurant.publicSettings.useQuery();

  const [form, setForm] = useState({
    guestName: "",
    phone: "",
    email: "",
    eventType: "birthday",
    partySize: 15,
    reservationDate: "",
    reservationTime: "19:30",
    decorPreference: "Festive Marigold & Warm Diyas",
    specialDiet: "Standard Pure Veg",
    notes: "",
  });

  const [submittedReservation, setSubmittedReservation] = useState<{
    id: number;
    guestName: string;
    partySize: number;
    reservationDate: string;
    reservationTime: string;
  } | null>(null);

  const reserveMutation = trpc.customer.reserve.useMutation({
    onSuccess: (data) => {
      toast.success("Celebration inquiry received! Our events concierge will call you.");
      setSubmittedReservation({
        id: data.id,
        guestName: form.guestName,
        partySize: form.partySize,
        reservationDate: form.reservationDate,
        reservationTime: form.reservationTime,
      });
    },
    onError: (err) => {
      toast.error(err.message || "Could not submit celebration request. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.phone.trim() || !form.reservationDate) {
      toast.error("Please fill in your name, mobile number, and preferred date.");
      return;
    }

    const notesSummary = `[Celebration: ${form.eventType.toUpperCase()} | Party: ${form.partySize} | Decor: ${form.decorPreference} | Diet: ${form.specialDiet}] ${form.notes.trim()}`;

    reserveMutation.mutate({
      guestName: form.guestName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      partySize: form.partySize,
      reservationDate: form.reservationDate,
      reservationTime: form.reservationTime,
      notes: notesSummary,
    });
  };

  const whatsappPhone = settings?.whatsapp?.replace(/[^0-9]/g, "") || "919876543210";

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />
      <CartDrawer />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-36 pb-24 border-b border-white/10">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#161016]/90 via-[#161016]/95 to-[#161016]" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/10 px-4 py-1.5 backdrop-blur-md text-[#d6a85e] text-xs uppercase tracking-[0.2em] mb-6">
            <Sparkles size={14} />
            <span>Private Dining & Royal Banquets</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight text-[#f8f1e8] max-w-4xl mx-auto leading-[1.05]">
            Celebrate Life’s Finest Moments
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
            From intimate anniversary gatherings to grand 100-guest birthday feasts and sacred sattvik family celebrations — our master chefs and hospitality team create memories steeped in Mithila warmth.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#inquire"
              className="rounded-full bg-[#d6a85e] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#161016] shadow-xl hover:bg-[#e4ba72] transition"
            >
              Plan Your Celebration ↓
            </a>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hello Radhe Radhe! I would like to inquire about hosting a celebration/event.")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>

          {/* Stat Pillars */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-white/10 pt-10 text-center">
            <div>
              <p className="font-serif text-3xl text-[#d6a85e]">100%</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">Pure Vegetarian</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-[#d6a85e]">Up to 150</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">Banqueting Capacity</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-[#d6a85e]">Live Tandoor</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">Fresh Clay Embers</p>
            </div>
            <div>
              <p className="font-serif text-3xl text-[#d6a85e]">Sattvik</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">No Onion/Garlic Option</p>
            </div>
          </div>
        </div>
      </section>

      {/* Occasions Showcase */}
      <section className="mx-auto max-w-7xl px-5 lg:px-10 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#d6a85e]">Tailored Milestones</p>
          <h2 className="mt-2 font-serif text-4xl sm:text-5xl tracking-tight">Spaces & Experiences</h2>
          <p className="mt-3 text-sm text-white/60 font-light">
            Every celebration at Shri Radhe Radhe includes dedicated seating, personalized welcome drinks, and hands-on event coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CELEBRATION_TYPES.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1c151c] transition-all hover:border-[#d6a85e]/40 hover:shadow-2xl"
            >
              <div className="h-64 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c151c] via-[#1c151c]/40 to-transparent" />
                <span className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a85e] border border-[#d6a85e]/30">
                  {item.badge}
                </span>
                <span className="absolute bottom-4 right-4 text-xs font-mono text-white/80 bg-black/50 px-3 py-1 rounded-full border border-white/10">
                  {item.minGuests}
                </span>
              </div>
              <div className="p-8">
                <h3 className="font-serif text-2xl text-white group-hover:text-[#d6a85e] transition">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-white/70 font-light leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-white/50 flex items-center gap-1.5">
                    <Utensils size={13} className="text-[#d6a85e]" /> Custom Multi-Course Menu
                  </span>
                  <a
                    href="#inquire"
                    onClick={() => setForm((prev) => ({ ...prev, eventType: item.id }))}
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6a85e] flex items-center gap-1 group-hover:underline"
                  >
                    Select Occasion <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Banqueting Inclusions */}
      <section className="bg-[#120d12] border-y border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="h-10 w-10 rounded-full bg-[#d6a85e]/10 text-[#d6a85e] grid place-items-center mb-4">
                <PartyPopper size={20} />
              </div>
              <h4 className="font-serif text-lg text-white">Curated Decor & Aesthetics</h4>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-light">
                Fresh floral table runners, festive marigold strings, brass diyas, and celebratory banner setups crafted by our in-house decor team.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="h-10 w-10 rounded-full bg-[#d6a85e]/10 text-[#d6a85e] grid place-items-center mb-4">
                <Utensils size={20} />
              </div>
              <h4 className="font-serif text-lg text-white">Live Embers & Tandoor Service</h4>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-light">
                Hot rotis and stuffed chur chur kulchas slapped fresh from the tandoor directly to your guests' plates alongside simmering gravies.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="h-10 w-10 rounded-full bg-[#d6a85e]/10 text-[#d6a85e] grid place-items-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-serif text-lg text-white">Strict Dietary Integrity</h4>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-light">
                100% vegetarian culinary practice. Pure ghee preparations, Jain menus, and zero-garlic/onion feasts managed with reverence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section id="inquire" className="mx-auto max-w-4xl px-5 lg:px-10 py-24 scroll-mt-20">
        <div className="rounded-[2.5rem] border border-[#d6a85e]/30 bg-[#1c151c] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d6a85e]/5 rounded-full blur-3xl pointer-events-none" />

          {submittedReservation ? (
            <div className="text-center py-10">
              <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-6">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#d6a85e]">Celebration Request Logged</p>
              <h3 className="font-serif text-4xl text-white mt-2">We Look Forward to Hosting You!</h3>
              <p className="mt-3 text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{submittedReservation.guestName}</strong>. Request #{submittedReservation.id} for <strong>{submittedReservation.partySize} guests</strong> on <strong>{submittedReservation.reservationDate} at {submittedReservation.reservationTime}</strong> has been sent to our events director.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                    `Hello Radhe Radhe team! I just submitted Celebration Request #${submittedReservation.id} for ${submittedReservation.partySize} guests on ${submittedReservation.reservationDate}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#d6a85e] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#161016] flex items-center gap-2 hover:bg-[#e4ba72] transition"
                >
                  <MessageCircle size={16} />
                  <span>Instant WhatsApp Follow-up</span>
                </a>
                <button
                  onClick={() => setSubmittedReservation(null)}
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition"
                >
                  Book Another Occasion
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-[11px] uppercase tracking-[0.3em] text-[#d6a85e]">Reserve Your Date</span>
                <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Plan Your Event With Us</h2>
                <p className="mt-2 text-xs text-white/60 font-light">
                  Fill in your preferred celebration details below. Our events concierge will review kitchen capacity and contact you within 2 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Occasion & Party Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Celebration Type
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#d6a85e] focus:outline-none"
                    >
                      <option value="birthday" className="bg-[#1c151c]">Birthday Celebration</option>
                      <option value="anniversary" className="bg-[#1c151c]">Anniversary Milestone</option>
                      <option value="spiritual" className="bg-[#1c151c]">Sattvik / Puja Feast</option>
                      <option value="corporate" className="bg-[#1c151c]">Corporate / Executive Dinner</option>
                      <option value="reunion" className="bg-[#1c151c]">Family Reunion & Banquet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Estimated Guests: <span className="font-bold text-[#d6a85e]">{form.partySize} Guests</span>
                    </label>
                    <div className="flex items-center gap-4 pt-2">
                      <input
                        type="range"
                        min="2"
                        max="100"
                        value={form.partySize}
                        onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
                        className="w-full accent-[#d6a85e]"
                      />
                      <span className="font-mono text-xs w-10 text-right">{form.partySize}</span>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={form.reservationDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Preferred Time Slot
                    </label>
                    <select
                      value={form.reservationTime}
                      onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#d6a85e] focus:outline-none"
                    >
                      <option value="12:30" className="bg-[#1c151c]">Royal Lunch — 12:30 PM</option>
                      <option value="13:30" className="bg-[#1c151c]">Afternoon Feast — 1:30 PM</option>
                      <option value="19:00" className="bg-[#1c151c]">Early Dinner — 7:00 PM</option>
                      <option value="19:45" className="bg-[#1c151c]">Prime Evening — 7:45 PM</option>
                      <option value="20:30" className="bg-[#1c151c]">Late Gala — 8:30 PM</option>
                    </select>
                  </div>
                </div>

                {/* Decor & Dietary Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Decoration Theme
                    </label>
                    <select
                      value={form.decorPreference}
                      onChange={(e) => setForm({ ...form, decorPreference: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#d6a85e] focus:outline-none"
                    >
                      <option value="Festive Marigold & Warm Diyas" className="bg-[#1c151c]">Festive Marigold & Warm Diyas</option>
                      <option value="Royal Rose Petals & Floating Candles" className="bg-[#1c151c]">Royal Rose Petals & Floating Candles</option>
                      <option value="Joyful Balloon Arch & Birthday Backdrop" className="bg-[#1c151c]">Joyful Balloon Arch & Backdrop</option>
                      <option value="Minimal Elegant Table Dressing" className="bg-[#1c151c]">Minimal Elegant Table Dressing</option>
                      <option value="None / Dining Only" className="bg-[#1c151c]">None (Dining Focus Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Culinary & Dietary Focus
                    </label>
                    <select
                      value={form.specialDiet}
                      onChange={(e) => setForm({ ...form, specialDiet: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white focus:border-[#d6a85e] focus:outline-none"
                    >
                      <option value="Standard Pure Veg" className="bg-[#1c151c]">Signature Pure Veg (Chef's Best)</option>
                      <option value="Sattvik (No Onion & Garlic)" className="bg-[#1c151c]">Sattvik (Zero Onion & Garlic)</option>
                      <option value="Jain Feasting Menu" className="bg-[#1c151c]">Jain Feasting Menu (No Root Veg)</option>
                      <option value="Kid-Friendly & Mild Spice" className="bg-[#1c151c]">Kid-Friendly & Mild Spice</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rameshwar Thakur"
                      value={form.guestName}
                      onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.16em] text-white/70 mb-2">
                    Special Wishes / Custom Cake / Music Requests
                  </label>
                  <textarea
                    rows={3}
                    placeholder="E.g. Cake cutting ceremony at 8 PM, would like live flute or traditional instrumental music, senior guests attending..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reserveMutation.isPending}
                  className="w-full rounded-2xl bg-[#d6a85e] py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#161016] shadow-xl hover:bg-[#e4ba72] transition disabled:opacity-50"
                >
                  {reserveMutation.isPending ? "Submitting Celebration Request..." : "Request Celebration Reservation →"}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0f0b0f] px-5 py-10 text-center text-xs text-white/40">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="uppercase tracking-[0.24em]">Shri Radhe Radhe Restaurant · Lohna Road, Dharampur, Darbhanga</p>
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em]">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/menu" className="hover:text-white">Menu</Link>
            <Link href="/celebrate" className="text-[#d6a85e]">Celebrations</Link>
            {user && (
              <Link href="/profile" className="hover:text-white">Account</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
