import { useState } from "react";
import { Star, X, CheckCircle2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface OrderReviewModalProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OrderReviewModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: OrderReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");

  const utils = trpc.useUtils();
  const { data: existingReview, isLoading } = trpc.customer.getOrderReview.useQuery(
    { orderId },
    { enabled: isOpen }
  );

  const submitReview = trpc.customer.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Thank you for sharing your experience! Your review is published.");
      utils.customer.getOrderReview.invalidate({ orderId });
      utils.reviews.featured.invalidate();
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review.");
    },
  });

  if (!isOpen) return null;

  const activeRating = hoveredRating !== null ? hoveredRating : rating;

  const ratingDescriptions: Record<number, string> = {
    1: "Needs Improvement",
    2: "Fair Experience",
    3: "Good & Fresh",
    4: "Great Hospitality!",
    5: "Pure Culinary Perfection! 🌟",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#d6a85e]/40 bg-[#1c151c] p-6 sm:p-8 text-[#f8f1e8] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <X size={16} />
        </button>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-white/50">Checking order review status…</div>
        ) : existingReview ? (
          <div className="text-center py-6">
            <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-[#d6a85e]/15 text-[#d6a85e] border border-[#d6a85e]/30 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-serif text-2xl text-white">Review Already Submitted</h3>
            <p className="mt-1 text-xs text-white/60">
              You reviewed order <span className="font-mono text-[#d6a85e]">{orderNumber}</span> on{" "}
              {new Date(existingReview.createdAt).toLocaleDateString("en-IN")}.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex items-center gap-1 text-[#d6a85e] mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < existingReview.rating ? "#d6a85e" : "transparent"}
                    className={i < existingReview.rating ? "text-[#d6a85e]" : "text-white/20"}
                  />
                ))}
                <span className="ml-2 text-xs font-mono text-white/70">{existingReview.rating}/5</span>
              </div>
              {existingReview.comment && (
                <p className="text-sm italic text-white/90">"{existingReview.comment}"</p>
              )}
              <p className="mt-2 text-[10px] text-white/50">— {existingReview.customerNameSnapshot}</p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-[#d6a85e] py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#161016] hover:bg-[#e4be7b] transition"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d6a85e]/40 bg-[#d6a85e]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#d6a85e] mb-3">
                <Sparkles size={12} />
                <span>Verified Dining Experience</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-white">Rate Your Order</h3>
              <p className="mt-1 text-xs text-white/60">
                Order <span className="font-mono text-[#d6a85e]">{orderNumber}</span>
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="my-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      size={32}
                      fill={star <= activeRating ? "#d6a85e" : "transparent"}
                      className={star <= activeRating ? "text-[#d6a85e]" : "text-white/30"}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-[#d6a85e] tracking-wide">
                {ratingDescriptions[activeRating]}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitReview.mutate({
                  orderId,
                  rating,
                  comment: comment.trim() || undefined,
                  customerName: name.trim() || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">
                  Your Thoughts on the Meal (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the flavor, tandoori warmth, and delivery speed?"
                  className="w-full rounded-2xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave blank to use account name"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#d6a85e] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitReview.isPending}
                className="w-full rounded-full bg-[#d6a85e] py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#161016] hover:bg-[#e4be7b] transition disabled:opacity-50 mt-2 shadow-xl"
              >
                {submitReview.isPending ? "Submitting Review…" : "Publish Review →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
