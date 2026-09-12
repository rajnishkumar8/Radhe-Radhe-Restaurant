import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Search, Sparkles, Flame, Plus, Clock3, ChefHat } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { DishCustomizerModal, type Dish } from "@/components/DishCustomizerModal";

export default function Menu() {
  const { data: user } = trpc.auth.me.useQuery();
  const isStaff = Boolean(user && ["owner", "manager", "order_staff", "admin"].includes(user.role));

  const { data: categories } = trpc.menu.categories.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const { data: menuItems, isLoading } = trpc.menu.list.useQuery(undefined, {
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  const { data: settings } = trpc.restaurant.publicSettings.useQuery();
  const { itemCount, subtotal, openCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<string>("all");
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Refs for each category section to drive scroll-spy
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});

  const filteredDishes = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((dish) => {
      if (selectedCategory && dish.categoryId !== selectedCategory) return false;
      if (dietaryFilter !== "all" && dish.dietary !== dietaryFilter) return false;
      if (onlyBestsellers && !dish.isBestseller) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          dish.name.toLowerCase().includes(q) ||
          dish.description.toLowerCase().includes(q) ||
          (dish.shortDescription && dish.shortDescription.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, onlyBestsellers, searchQuery]);

  // Group dishes by category when showing all (no filter active)
  const isFiltering = selectedCategory !== null || searchQuery.trim() !== "" || dietaryFilter !== "all" || onlyBestsellers;
  const groupedDishes = useMemo(() => {
    if (isFiltering || !categories || !filteredDishes.length) return null;
    return categories
      .filter((c) => filteredDishes.some((d) => d.categoryId === c.id))
      .map((cat) => ({
        category: cat,
        dishes: filteredDishes.filter((d) => d.categoryId === cat.id),
      }));
  }, [isFiltering, categories, filteredDishes]);

  // Scroll-spy: watch category sections entering the viewport
  useEffect(() => {
    if (isFiltering || !groupedDishes) return;
    const observers: IntersectionObserver[] = [];
    groupedDishes.forEach(({ category }) => {
      const el = sectionRefs.current[category.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategoryId(category.id);
          }
        },
        { threshold: 0.25, rootMargin: "-80px 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [isFiltering, groupedDishes]);

  const scrollToCategory = useCallback((catId: number) => {
    setSelectedCategory(null); // clear filter to show grouped layout
    setTimeout(() => {
      const el = sectionRefs.current[catId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }, []);

  const openDish = (dish: Dish) => {
    if (!dish.isAvailable) return;
    setSelectedDish(dish);
  };

  return (
    <div className="min-h-screen bg-[#161016] text-[#f8f1e8] selection:bg-[#d6a85e] selection:text-[#161016]">
      <Navbar />
      <CartDrawer />

      {/* Daily Special Banner */}
      {settings?.dailySpecial && (
        <div className="sticky top-20 z-30 border-b border-emerald-800/40 bg-emerald-950/80 px-5 py-2 text-center text-xs text-emerald-300 backdrop-blur-md flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-[0.2em]">{settings.dailySpecial}</span>
        </div>
      )}

      {isStaff && (
        <div className={`bg-[#d6a85e] text-[#161016] px-5 py-2.5 text-xs font-medium flex items-center justify-between z-30 ${settings?.dailySpecial ? "" : "sticky top-20"} border-b border-amber-600/30`}>
          <span className="flex items-center gap-2">
            <ChefHat size={15} />
            <span>Logged in as <strong>{user?.name} (Staff)</strong>. Customer ordering is disabled for staff accounts.</span>
          </span>
          <Link href="/admin" className="underline font-bold hover:text-black">
            Open Menu CMS in Admin →
          </Link>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-5 pb-28 pt-32 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#d6a85e]">Handmade Over Live Fire</p>
          <h1 className="mt-2 font-serif text-5xl sm:text-7xl tracking-[-0.04em]">Our Menu</h1>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Slow-cooked royal curries, charred copper-tandoor flatbreads, and aromatic heritage grains. Everything
            prepared fresh to your order.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-12 space-y-5">
          {/* Search Input */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, ingredients, curries…"
              className="w-full rounded-full border border-white/15 bg-[#211721] py-3 pl-11 pr-5 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#d6a85e] focus:bg-[#261c26] transition"
            />
          </div>

          {/* Sticky Category Tabs */}
          <div className="sticky top-20 z-20 -mx-5 bg-[#161016]/90 px-5 py-3 backdrop-blur-lg border-b border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-xs uppercase tracking-[0.16em] transition-all ${
                  selectedCategory === null && !isFiltering
                    ? "bg-[#d6a85e] text-[#161016] font-semibold shadow"
                    : selectedCategory === null
                    ? "bg-[#d6a85e] text-[#161016] font-semibold shadow"
                    : "border border-white/15 bg-white/5 text-white/70 hover:border-white/30"
                }`}
              >
                All Plates
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isFiltering) {
                      setSelectedCategory(cat.id);
                    } else {
                      scrollToCategory(cat.id);
                      setActiveCategoryId(cat.id);
                    }
                  }}
                  className={`whitespace-nowrap rounded-full px-5 py-2 text-xs uppercase tracking-[0.16em] transition-all ${
                    (isFiltering ? selectedCategory === cat.id : activeCategoryId === cat.id)
                      ? "bg-[#d6a85e] text-[#161016] font-semibold shadow"
                      : "border border-white/15 bg-white/5 text-white/70 hover:border-white/30"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary & Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.16em]">
            <button
              onClick={() => setDietaryFilter(dietaryFilter === "veg" ? "all" : "veg")}
              className={`rounded-full px-3.5 py-1.5 border transition ${
                dietaryFilter === "veg"
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
            >
              🌱 Pure Veg
            </button>
            <button
              onClick={() => setDietaryFilter(dietaryFilter === "vegan" ? "all" : "vegan")}
              className={`rounded-full px-3.5 py-1.5 border transition ${
                dietaryFilter === "vegan"
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
            >
              🌿 Vegan
            </button>
            <button
              onClick={() => setOnlyBestsellers(!onlyBestsellers)}
              className={`rounded-full px-3.5 py-1.5 border transition ${
                onlyBestsellers
                  ? "border-[#d6a85e] bg-[#d6a85e]/20 text-[#f4d59b]"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
            >
              ✨ Bestsellers Only
            </button>
          </div>
        </div>

        {/* Dish Catalog */}
        <div className="mt-14">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-96 rounded-[2rem] bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-white/80">No dishes found matching your selection.</p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                  setDietaryFilter("all");
                  setOnlyBestsellers(false);
                }}
                className="mt-4 rounded-full border border-white/20 px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-[#d6a85e] hover:bg-white/5"
              >
                Reset Filters
              </button>
            </div>
          ) : groupedDishes ? (
            // Grouped by category (scroll-spy mode)
            <div className="space-y-20">
              {groupedDishes.map(({ category, dishes }) => (
                <section
                  key={category.id}
                  ref={(el) => { sectionRefs.current[category.id] = el; }}
                  id={`cat-${category.id}`}
                  className="scroll-mt-40"
                >
                  <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#d6a85e]">Category</p>
                      <h2 className="mt-1 font-serif text-3xl sm:text-4xl text-white">{category.name}</h2>
                      {category.description && (
                        <p className="mt-1 text-xs text-white/50 max-w-md">{category.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-white/40 font-mono">{dishes.length} plates</span>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {dishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} isStaff={isStaff} onOpen={openDish} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            // Flat filtered list
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} isStaff={isStaff} onOpen={openDish} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Mobile Cart Bar for diners */}
      {!isStaff && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden animate-fade-in">
          <button
            onClick={openCart}
            className="flex w-full items-center justify-between rounded-full bg-[#d6a85e] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] shadow-2xl transition active:scale-95"
          >
            <span>View Order ({itemCount})</span>
            <span className="font-mono text-sm">₹{subtotal.toFixed(0)} →</span>
          </button>
        </div>
      )}

      {/* Dish Customizer Modal */}
      <DishCustomizerModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </div>
  );
}

// ─── Extracted Dish Card Component ────────────────────────────────────────────

function DishCard({
  dish,
  isStaff,
  onOpen,
}: {
  dish: any;
  isStaff: boolean;
  onOpen: (dish: Dish) => void;
}) {
  const isSoldOut = dish.isAvailable === false;

  return (
    <article
      onClick={() => !isSoldOut && onOpen(dish)}
      className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-[#211721] transition duration-300 hover:-translate-y-1 hover:border-[#d6a85e]/50 hover:shadow-xl ${
        isSoldOut ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {/* Dish Image */}
      <div className="relative aspect-[1.25] overflow-hidden bg-[#161016]">
        <img
          src={dish.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"}
          alt={dish.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211721] via-transparent to-transparent" />

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-red-400/50 bg-red-950/80 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
              Sold Out Today
            </span>
          </div>
        )}

        {/* Dietary badge */}
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
          {dish.dietary || "Veg"}
        </span>

        {dish.isBestseller && !isSoldOut && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#d6a85e] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#161016]">
            <Sparkles size={10} /> Bestseller
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl text-white group-hover:text-[#f4d59b] transition-colors">
              {dish.name}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-white/50">
              {dish.prepTimeMinutes && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={11} /> ~{dish.prepTimeMinutes}m
                </span>
              )}
              {dish.spiceLevel > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Flame size={11} /> {dish.spiceLevel === 1 ? "Mild" : "Spicy"}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-semibold text-[#f4d59b]">
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
            <span>Manage Dish in Admin</span>
            <ChefHat size={14} />
          </Link>
        ) : isSoldOut ? (
          <div className="mt-6 flex w-full items-center justify-center rounded-full border border-red-500/20 bg-red-950/20 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-red-400/70">
            Available Tomorrow
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(dish);
            }}
            className="mt-6 flex w-full items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white transition group-hover:border-[#d6a85e] group-hover:bg-[#d6a85e] group-hover:text-[#161016]"
          >
            <span>Add to Order</span>
            <Plus size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
