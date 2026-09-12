import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock3, MapPin, Sparkles, Plus, Check, AlertCircle, ChefHat, Star, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { DishCustomizerModal, type Dish } from "@/components/DishCustomizerModal";
import { ReservationModal } from "@/components/ReservationModal";

export default function Home() {
  const { data: user } = trpc.auth.me.useQuery();
  const isStaff = Boolean(user && ["owner", "manager", "order_staff", "admin"].includes(user.role));

  const { data: menuData } = trpc.menu.list.useQuery({ isFeatured: true });
  const { data: allMenuItems } = trpc.menu.list.useQuery(undefined);
  const { data: settings } = trpc.restaurant.publicSettings.useQuery();
  const { data: liveReviews } = trpc.reviews.featured.useQuery();
  const { itemCount, subtotal, openCart } = useCart();

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);

  const featuredDishes: Dish[] =
    menuData && menuData.length > 0
      ? menuData.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: d.price,
          discountPrice: d.discountPrice,
          imageUrl: d.imageUrl,
          dietary: d.dietary,
          spiceLevel: d.spiceLevel,
          prepTimeMinutes: d.prepTimeMinutes,
          isBestseller: d.isBestseller,
          isFeatured: d.isFeatured,
        }))
      : [
          {
            id: 1,
            name: "Royal Dal Makhani",
            description: "Slow-simmered black urad lentils, cultured churned butter, fresh tomato reduction, and sweet dried fenugreek.",
            price: "360.00",
            discountPrice: "320.00",
            imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
            dietary: "veg",
            spiceLevel: 1,
            prepTimeMinutes: 20,
            isBestseller: true,
            isFeatured: true,
          },
          {
            id: 2,
            name: "Saffron Paneer Tikka",
            description: "Handmade Malwa paneer steeped in Kashmiri saffron, crushed coriander seeds, hung curd, and kasundi glaze.",
            price: "420.00",
            discountPrice: null,
            imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
            dietary: "veg",
            spiceLevel: 2,
            prepTimeMinutes: 25,
            isBestseller: true,
            isFeatured: true,
          },
          {
            id: 3,
            name: "Tandoori Stuffed Morel & Garden Plate",
            description: "Charred young seasonal vegetables, smoked hung curd, mint-coriander oil, and charred citrus.",
            price: "390.00",
            discountPrice: null,
            imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            dietary: "vegan",
            spiceLevel: 1,
            prepTimeMinutes: 20,
            isBestseller: false,
            isFeatured: true,
          },
        ];

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />
      <CartDrawer />

      <main id="top">
        {/* Emergency Pause Notice (if active) */}
        {settings?.orderingPaused && (
          <div className="bg-[#b44d3d] text-white px-5 py-3 pt-24 text-center text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2">
            <AlertCircle size={15} />
            <span>{settings.orderingPauseMessage}</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative flex min-h-[780px] items-end overflow-hidden px-5 pb-20 pt-36 lg:min-h-[880px] lg:px-10 lg:pb-28">
          <div
            className="absolute inset-0 bg-cover bg-[center_60%] opacity-40 transition-transform duration-1000 scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161016] via-[#161016]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161016] via-[#161016]/30 to-transparent" />
          <div className="absolute -right-24 top-36 h-96 w-96 rounded-full bg-[#d6a85e]/15 blur-3xl" />

          <div className="relative mx-auto w-full max-w-7xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6a85e]/40 bg-black/40 px-4 py-1.5 backdrop-blur-md">
              <Sparkles size={13} className="text-[#d6a85e]" />
              <span className="text-[10px] uppercase tracking-[0.32em] text-[#f4d59b]">Culinary Hospitality in Darbhanga</span>
            </div>

            {/* Daily Special Banner */}
            {settings?.dailySpecial && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/60 px-4 py-1.5 backdrop-blur-md shadow-lg shadow-emerald-900/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.24em] text-emerald-300 font-semibold">{settings.dailySpecial}</span>
              </div>
            )}

            <h1 className="max-w-3xl font-serif text-6xl leading-[0.92] tracking-[-0.05em] sm:text-8xl lg:text-[9.2rem]">
              Flame.<br />
              <em className="font-light text-[#d6a85e]">Memory.</em><br />
              Together.
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-white/70">
              A sovereign expression of the Indian dining table—slow embers, patient heritage spices, and the warmth of
              coming home on Lohna Road.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#d6a85e] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] transition duration-200 hover:-translate-y-0.5 hover:brightness-110 shadow-lg"
              >
                <span>Explore Full Menu</span>
                <ArrowRight size={15} />
              </Link>

              {isStaff ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-[#d6a85e] bg-[#d6a85e]/15 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d59b] transition duration-200 hover:bg-[#d6a85e] hover:text-[#161016]"
                >
                  <ChefHat size={15} />
                  <span>Operations Console</span>
                </Link>
              ) : (
                <button
                  onClick={() => setReserveModalOpen(true)}
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/25 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] transition duration-200 hover:border-[#d6a85e] hover:text-[#d6a85e] hover:bg-white/5"
                >
                  Reserve a Table
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Status & Hours Bar */}
        <section className="border-y border-white/10 bg-[#211721] px-5 py-5 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[10px] uppercase tracking-[0.22em] text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Clock3 size={14} className="text-[#d6a85e]" />
              <span>
                {settings?.orderingPaused
                  ? settings.orderingPauseMessage || "Temporarily Closed"
                  : settings?.busyMode === "busy"
                  ? "Kitchen Busy · ~50m Delivery"
                  : settings?.busyMode === "very_busy"
                  ? "Peak Rush · ~75m Delivery"
                  : new Date().getDay() === 1
                  ? "Closed Today (Monday) · Open Tue–Sun"
                  : "Open Today · 12:00 — 23:00"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-[#d6a85e]" />
              <span>{settings?.address || "Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga"}</span>
            </span>
            <span className="hidden text-[#d6a85e] sm:block">Dine-in & Delivery · Pure Vegetarian Direct Ordering</span>
          </div>
        </section>

        {/* Featured Menu Plates */}
        <section id="menu" className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32">
          <div className="mb-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Chef's Signature Selections</p>
              <h2 className="font-serif text-5xl tracking-[-0.04em] sm:text-7xl">
                Made to <em className="font-light text-[#d6a85e]">linger.</em>
              </h2>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d6a85e] hover:underline"
            >
              <span>View All {allMenuItems?.length ? `${allMenuItems.length}+` : "30+"} Dishes</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featuredDishes.map((dish) => (
              <article
                key={dish.id}
                onClick={() => !((dish as any).isAvailable === false) && setSelectedDish(dish)}
                className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-[#261c26] transition duration-300 hover:-translate-y-1.5 hover:border-[#d6a85e]/50 hover:shadow-2xl ${
                  (dish as any).isAvailable === false ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <div className="relative aspect-[1.15] overflow-hidden bg-[#161016]">
                  <img
                    src={dish.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"}
                    alt={dish.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#261c26] via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                    {dish.dietary || "Veg"}
                  </span>
                  {(dish as any).isAvailable === false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                      <span className="rounded-full border border-red-400/50 bg-red-950/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
                        Sold Out Today
                      </span>
                    </div>
                  )}
                  {dish.discountPrice && (dish as any).isAvailable !== false && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#d6a85e] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#161016]">
                      Special
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl text-white group-hover:text-[#f4d59b] transition-colors">
                      {dish.name}
                    </h3>
                    <div className="text-right">
                      <span className="font-mono text-base text-[#f4d59b]">
                        ₹{dish.discountPrice || dish.price}
                      </span>
                      {dish.discountPrice && (
                        <span className="block font-mono text-xs text-white/40 line-through">
                          ₹{dish.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-white/60 line-clamp-2">{dish.description}</p>

                  {isStaff ? (
                    <Link
                      href="/admin"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-6 flex w-full items-center justify-between rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/15 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-[#d6a85e] transition hover:bg-[#d6a85e] hover:text-[#161016]"
                    >
                      <span>Manage in Admin Console</span>
                      <ChefHat size={14} />
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDish(dish);
                      }}
                      className="mt-6 flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white transition group-hover:border-[#d6a85e] group-hover:bg-[#d6a85e] group-hover:text-[#161016]"
                    >
                      <span>Customize & Add</span>
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Brand Narrative Section */}
        <section id="story" className="relative overflow-hidden bg-[#d5a45c] px-5 py-24 text-[#251925] lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#6e3d2d]">Our Point of View</p>
              <h2 className="font-serif text-6xl leading-[0.92] tracking-[-0.05em] sm:text-8xl">
                The table<br />
                <em className="font-light">is the story.</em>
              </h2>
            </div>
            <div className="max-w-xl">
              <p className="text-2xl leading-snug sm:text-3xl font-serif">
                Radhe Radhe is a celebration of rich Mithila culinary warmth and authentic North Indian flavours on Lohna
                Road—setting a generous, patient table for you and your family.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-[#6e3d2d]">
                From copper tandoors smoking with sweet wood to slow-simmered royal lentils churned with white butter,
                our kitchen celebrates patient slow cooking. Come for the first bite; stay for the stories shared
                between courses.
              </p>
              {isStaff ? (
                <Link
                  href="/admin"
                  className="mt-8 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#251925] underline hover:text-[#6e3d2d]"
                >
                  <span>Open Operations Console</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  onClick={() => setReserveModalOpen(true)}
                  className="mt-8 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#251925] underline hover:text-[#6e3d2d]"
                >
                  <span>Reserve your evening with us</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Ambience & Culinary Gallery */}
        <section className="border-t border-white/10 bg-[#161016] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Ambience & Craft</p>
                <h2 className="font-serif text-4xl tracking-[-0.03em] sm:text-6xl text-white">
                  A glimpse of <em className="font-light text-[#d6a85e]">Radhe Radhe.</em>
                </h2>
              </div>
              <p className="max-w-md text-xs text-white/60 leading-relaxed">
                Step into a world of pure vegetarian culinary refinement, crafted celebration spaces, and traditional Mithila hospitality.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#211721]">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
                  alt="Main Dining Hall"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#d6a85e]">Dining Hall</p>
                  <p className="font-serif text-sm text-white">Warm & Intimate Seating</p>
                </div>
              </div>

              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#211721]">
                <img
                  src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
                  alt="Tandoori Delights"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#d6a85e]">Copper Tandoor</p>
                  <p className="font-serif text-sm text-white">Crisp Breads & Paneer Tikka</p>
                </div>
              </div>

              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#211721]">
                <img
                  src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80"
                  alt="Royal Dal Makhani"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#d6a85e]">Slow Simmered</p>
                  <p className="font-serif text-sm text-white">Pure Desi Ghee Gravies</p>
                </div>
              </div>

              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#211721]">
                <img
                  src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80"
                  alt="Celebration Banquet"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#d6a85e]">Celebration Hall</p>
                  <p className="font-serif text-sm text-white">Parties & Gatherings</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Testimonials Section */}
        <section className="border-t border-white/10 bg-[#1c141c] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="mb-14 text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Guest Stories</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-0.03em] sm:text-6xl text-white">
                Loved across <em className="font-light text-[#d6a85e]">Darbhanga.</em>
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {(liveReviews && liveReviews.length > 0 ? liveReviews.slice(0, 3) : [
                {
                  id: 1,
                  rating: 5,
                  comment: "The best Dal Makhani and Garlic Naan in the entire Manigachhi area! Slow-simmered rich flavor and 100% pure vegetarian. Even our out-of-town guests were deeply impressed.",
                  customerNameSnapshot: "Rajesh & Suman Thakur",
                  tag: "Diner",
                  subtitle: "Family Dining · Lohna Road",
                },
                {
                  id: 2,
                  rating: 5,
                  comment: "We booked the private hall for our daughter's birthday celebration. The staff handled 35 guests smoothly, and the Kadhai Paneer and Jeera Rice arrived piping hot for everyone.",
                  customerNameSnapshot: "Dr. Alok Jha",
                  tag: "Host",
                  subtitle: "Celebration Event · Dharampur",
                },
                {
                  id: 3,
                  rating: 5,
                  comment: "Home delivery is incredibly fast! Food arrived neatly packaged with zero spills, and the direct UPI payment was effortless. Definitely our go-to weekend dinner.",
                  customerNameSnapshot: "Pooja Kumari",
                  tag: "Delivery",
                  subtitle: "Regular Delivery Diner",
                },
              ]).map((rev: any) => (
                <div key={rev.id} className="rounded-3xl border border-white/10 bg-[#261c26] p-7 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[#d6a85e] mb-4">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} size={15} fill="#d6a85e" />
                      ))}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed italic">
                      "{rev.comment || "Exceptional food and hospitality. A true culinary gem in Darbhanga!"}"
                    </p>
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-serif text-white font-medium">{rev.customerNameSnapshot}</p>
                      <p className="text-[10px] text-white/50">{rev.subtitle || "Verified Order Guest"}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#d6a85e] font-mono">
                      {rev.tag || "Verified"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visit & Ambience Section */}
        <section id="visit" className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-[1fr_0.8fr] lg:px-10 lg:py-32">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Find Your Way Here</p>
            <h2 className="font-serif text-5xl tracking-[-0.04em] sm:text-7xl">
              See you <em className="font-light text-[#d6a85e]">soon.</em>
            </h2>

            <div className="mt-10 grid gap-6 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#211721] p-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#d6a85e]">Dining Hours</p>
                <p className="leading-relaxed">
                  Tuesday — Sunday<br />
                  12:00 PM — 11:00 PM<br />
                  <span className="text-white/40 text-xs">Kitchen last order at 10:30 PM (Closed Mondays)</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#211721] p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d6a85e]">Address</p>
                  <a
                    href="https://www.google.com/maps/place/Radhe+Communication/@26.2194021,86.2313645,14.68z/data=!4m6!3m5!1s0x39edd7b015579f4f:0x94fc80b038fc4970!8m2!3d26.2182293!4d86.227211!16s%2Fg%2F11c1wwrpth?entry=ttu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#d6a85e] hover:underline inline-flex items-center gap-1"
                  >
                    <MapPin size={12} /> View on Map
                  </a>
                </div>
                <p className="leading-relaxed">
                  {settings?.address || "Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar 847407"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => setReserveModalOpen(true)}
                className="rounded-full bg-[#f3eadf] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] transition hover:bg-[#d6a85e]"
              >
                Reserve a Table
              </button>
              <a
                href="https://www.google.com/maps/place/Radhe+Communication/@26.2194021,86.2313645,14.68z/data=!4m6!3m5!1s0x39edd7b015579f4f:0x94fc80b038fc4970!8m2!3d26.2182293!4d86.227211!16s%2Fg%2F11c1wwrpth?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-[#d6a85e] hover:text-[#d6a85e] inline-flex items-center gap-2"
              >
                <MapPin size={14} /> Get Directions
              </a>
              <a
                href={`tel:${settings?.phone || "+919876543210"}`}
                className="rounded-full border border-white/20 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-[#d6a85e] hover:text-[#d6a85e] inline-flex items-center gap-2"
              >
                <Phone size={14} /> Call Us
              </a>
            </div>
          </div>

          <Link
            href="/celebrate"
            className="group relative min-h-[360px] overflow-hidden rounded-[2.5rem] border border-[#d6a85e]/30 bg-cover bg-center shadow-2xl transition hover:border-[#d6a85e] block"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=1000&q=80')",
            }}
          >
            <div className="absolute inset-0 bg-[#161016]/40 group-hover:bg-[#161016]/20 transition" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#d6a85e] block mb-1">
                  Private Dining & Banquets
                </span>
                <span className="text-base font-serif text-white/95">
                  A room for every kind of celebration →
                </span>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d6a85e] text-[#161016] group-hover:scale-110 transition">
                <ArrowRight size={17} />
              </span>
            </div>
          </Link>
        </section>
      </main>

      {/* Sticky Mobile Cart Bar (Active when items > 0 and user is regular diner) */}
      {!isStaff && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden animate-fade-in">
          <button
            onClick={openCart}
            className="flex w-full items-center justify-between rounded-full bg-[#d6a85e] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] shadow-2xl transition active:scale-95"
          >
            <span className="flex items-center gap-2">
              <span>View Order ({itemCount})</span>
            </span>
            <span className="font-mono text-sm">₹{subtotal.toFixed(0)} →</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <DishCustomizerModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
      <ReservationModal isOpen={reserveModalOpen} onClose={() => setReserveModalOpen(false)} />

      <footer className="border-t border-white/10 bg-[#0f0b0f] px-5 py-10 text-center text-xs text-white/40">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="uppercase tracking-[0.24em]">Shri Radhe Radhe Restaurant · Lohna Road, Dharampur, Darbhanga</p>
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em]">
            <Link href="/menu" className="hover:text-white">Menu</Link>
            {isStaff && (
              <Link href="/admin" className="hover:text-[#d6a85e]">Staff Portal</Link>
            )}
            {user?.role === "driver" && (
              <Link href="/driver" className="hover:text-emerald-400">Driver Portal</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
