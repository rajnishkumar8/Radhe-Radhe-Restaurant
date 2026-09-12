import { useState, useEffect } from "react";
import { X, Plus, Minus, Clock, Flame, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: string | number;
  discountPrice?: string | number | null;
  imageUrl?: string | null;
  dietary?: string | null;
  spiceLevel?: number;
  prepTimeMinutes?: number;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
}

interface DishCustomizerModalProps {
  dish: Dish | null;
  onClose: () => void;
}

export function DishCustomizerModal({ dish, onClose }: DishCustomizerModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  // Reset state when the selected dish changes so stale quantity/notes don't carry over
  useEffect(() => {
    setQuantity(1);
    setNotes("");
  }, [dish?.id]);

  if (!dish) return null;

  const effectivePrice = Number(dish.discountPrice || dish.price);
  const totalPrice = (effectivePrice * quantity).toFixed(0);

  const handleAddToCart = () => {
    addItem(dish, quantity, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#211721] text-[#f8f1e8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Dish Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#161016]">
          <img
            src={dish.imageUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"}
            alt={dish.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#211721] via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-4 left-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#d6a85e]/40 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f4d59b] backdrop-blur-md">
              {dish.dietary || "Vegetarian"}
            </span>
            {dish.isBestseller && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d6a85e] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#161016]">
                <Sparkles size={11} /> Bestseller
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-white">{dish.name}</h2>
              <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                {dish.prepTimeMinutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-[#d6a85e]" /> ~{dish.prepTimeMinutes} mins
                  </span>
                )}
                {dish.spiceLevel !== undefined && dish.spiceLevel > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Flame size={13} className="text-amber-500" />
                    {"🌶️".repeat(dish.spiceLevel)} {dish.spiceLevel === 1 ? "Mild" : dish.spiceLevel === 2 ? "Medium" : "Spicy"}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-medium text-[#f4d59b]">₹{effectivePrice}</p>
              {dish.discountPrice && (
                <p className="text-xs text-white/40 line-through">₹{dish.price}</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-white/70">{dish.description}</p>

          {/* Special Instructions */}
          <div className="mt-6">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/50">
              Kitchen Preparation Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Less oil, extra green chillies, no onion-garlic"
              maxLength={150}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d6a85e] focus:bg-white/10"
            />
          </div>

          {/* Quantity & Add Action */}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
                className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-mono text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                aria-label="Increase quantity"
                className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d6a85e] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#161016] transition duration-200 hover:brightness-110 active:scale-95"
            >
              <span>Add to Order</span>
              <span className="font-mono">· ₹{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
