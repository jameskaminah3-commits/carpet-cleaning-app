import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Shield, Sparkles, Ticket, ArrowRight } from "lucide-react";
import type { Promotion } from "@shared/schema";

function getDaysLeft(expiresAt: string | Date | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

export function FloatingPromoBar({
  promo,
  onAction,
}: {
  promo: Promotion;
  onAction: () => void;
}) {
  const daysLeft = getDaysLeft(promo.expiresAt);
  const promoLine = [
    promo.name,
    promo.description || "Fresh savings on your next carpet cleaning",
    promo.couponCode ? `Code ${promo.couponCode}` : null,
    daysLeft ? `Ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join("   *   ");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative z-[60] w-full border-b border-sky-200/70 bg-white/95 backdrop-blur-xl"
      data-testid="floating-promo-bar"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-2 sm:items-center">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white sm:mt-0">
            <Gift className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                Limited Offer
              </p>
              {promo.isVipOnly && (
                <Badge className="border-0 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                  <Shield className="mr-1 h-3 w-3" /> VIP
                </Badge>
              )}
            </div>
            <p className="line-clamp-1 text-sm font-bold leading-tight text-slate-900">
              {promo.name}
            </p>
            <div className="mt-1 overflow-hidden rounded-full bg-slate-950/[0.04] px-2.5 py-1 sm:hidden">
              <motion.div
                className="whitespace-nowrap text-[11px] font-medium text-slate-600"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <span className="mr-8 inline-block">{promoLine}</span>
                <span className="inline-block">{promoLine}</span>
              </motion.div>
            </div>
            <div className="mt-1 hidden overflow-hidden sm:block">
              <motion.div
                className="whitespace-nowrap text-xs font-medium text-slate-600"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              >
                <span className="mr-10 inline-block">{promoLine}</span>
                <span className="inline-block">{promoLine}</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          {promo.couponCode && (
            <div className="min-w-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-900">
              <Ticket className="mr-1 inline h-3 w-3 text-sky-600" />
              <span className="mr-1 text-sky-600">Code</span>
              <span className="font-mono">{promo.couponCode}</span>
            </div>
          )}
          <Button
            onClick={onAction}
            size="sm"
            className="h-9 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] px-4 text-xs shadow-md shadow-blue-500/20"
            data-testid="button-floating-promo-cta"
          >
            <motion.span
              className="inline-flex items-center"
              animate={{ x: [0, 1.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              Claim Offer <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </motion.span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function PromoFeatureCard({
  promo,
  onAction,
}: {
  promo: Promotion;
  onAction: () => void;
}) {
  const daysLeft = getDaysLeft(promo.expiresAt);

  return (
    <Card
      className="w-[88vw] max-w-[320px] overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-0 text-white shadow-lg shadow-slate-900/10 flex-shrink-0 sm:w-auto sm:min-w-[280px]"
      data-testid={`card-promo-${promo.id}`}
    >
      <div className="relative p-4 sm:p-4">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="absolute -bottom-10 left-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 shrink-0">
                <Sparkles className="h-4 w-4 text-sky-200" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-sky-200/80">
                  Special Offer
                </p>
                <h4 className="line-clamp-2 text-sm font-semibold leading-tight">{promo.name}</h4>
              </div>
            </div>
            {promo.isVipOnly && (
              <Badge className="border-0 bg-amber-400/20 text-[10px] text-amber-100 shrink-0">
                <Shield className="mr-1 h-3 w-3" /> VIP
              </Badge>
            )}
          </div>

          {promo.description && (
            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-200">
              {promo.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {promo.couponCode && (
              <div className="max-w-full rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <span className="mr-1 text-sky-200">Use code</span>
                <span className="font-mono text-white break-all">{promo.couponCode}</span>
              </div>
            )}
            {daysLeft && (
              <Badge className="border-0 bg-emerald-400/15 text-[10px] text-emerald-100">
                Ends in {daysLeft} day{daysLeft > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            onClick={onAction}
            className="mt-4 w-full rounded-xl bg-white text-slate-900 hover:bg-slate-100"
            data-testid={`button-use-promo-${promo.id}`}
          >
            Book With This Offer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
