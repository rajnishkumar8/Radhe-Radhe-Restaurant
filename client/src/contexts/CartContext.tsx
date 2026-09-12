import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type CartItem = {
  menuItemId: number;
  name: string;
  price: string | number;
  imageUrl?: string | null;
  dietary?: string | null;
  quantity: number;
  specialInstructions?: string;
};

export type CartTotals = {
  subtotal: string;
  discountAmount: string;
  packagingFee: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  appliedCouponCode?: string;
};

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totals: CartTotals | null;
  isCalculating: boolean;
  isOpen: boolean;
  fulfillmentType: "delivery" | "pickup";
  couponCode: string;
  addItem: (item: {
    id: number;
    name: string;
    price: string | number;
    imageUrl?: string | null;
    dietary?: string | null;
  }, quantity?: number, specialInstructions?: string) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  clearCart: () => void;
  setFulfillmentType: (type: "delivery" | "pickup") => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "radhe_cart_items_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setOpen] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [couponCode, setCouponCode] = useState<string>("");
  const [totals, setTotals] = useState<CartTotals | null>(null);

  const calculateMutation = trpc.cart.calculate.useMutation({
    onSuccess: (data) => {
      setTotals({
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        packagingFee: data.packagingFee,
        deliveryFee: data.deliveryFee,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        appliedCouponCode: data.appliedCouponCode,
      });
    },
    onError: () => {
      // Fallback rough client calculation if offline
      const rawSub = items.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);
      const pkg = fulfillmentType === "delivery" ? 25 : 0;
      const del = fulfillmentType === "delivery" && rawSub < 499 ? 40 : 0;
      const tax = Number((rawSub * 0.05).toFixed(2));
      setTotals({
        subtotal: rawSub.toFixed(2),
        discountAmount: "0.00",
        packagingFee: pkg.toFixed(2),
        deliveryFee: del.toFixed(2),
        taxAmount: tax.toFixed(2),
        totalAmount: (rawSub + pkg + del + tax).toFixed(2),
      });
    },
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("[Cart] Could not save to localStorage:", e);
    }
  }, [items]);

  // Request server authoritative calculation whenever items, fulfillment, or coupon change
  useEffect(() => {
    if (items.length === 0) {
      setTotals(null);
      return;
    }

    calculateMutation.mutate({
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        specialInstructions: i.specialInstructions,
      })),
      fulfillmentType,
      couponCode: couponCode || undefined,
    });
  }, [items, fulfillmentType, couponCode]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0), [items]);

  const addItem = (
    dish: {
      id: number;
      name: string;
      price: string | number;
      imageUrl?: string | null;
      dietary?: string | null;
    },
    quantity = 1,
    specialInstructions?: string
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === dish.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === dish.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                specialInstructions: specialInstructions || i.specialInstructions,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: dish.id,
          name: dish.name,
          price: dish.price,
          imageUrl: dish.imageUrl,
          dietary: dish.dietary,
          quantity,
          specialInstructions,
        },
      ];
    });
    // Show a toast with a "View Cart" action instead of aggressively opening the drawer
    toast.success(`${dish.name} added to your order`, {
      description: `${quantity}× added · tap to view cart`,
      action: {
        label: "View Cart",
        onClick: () => setOpen(true),
      },
      duration: 3000,
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: Math.min(20, quantity) } : i))
    );
  };

  const removeItem = (menuItemId: number) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode("");
    setTotals(null);
  };

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    totals,
    isCalculating: calculateMutation.isPending,
    isOpen,
    fulfillmentType,
    couponCode,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setFulfillmentType,
    applyCoupon: (code: string) => setCouponCode(code.trim().toUpperCase()),
    removeCoupon: () => setCouponCode(""),
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
