import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkles, Home, Package, Tag, UserCircle, ChevronRight, MapPin,
  Plus, Edit3, Clock, CheckCircle2, Bell, Phone, Loader2, X,
  CreditCard, AlertCircle, Gift, Shield, Star
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES, TAG_COLORS } from "@shared/schema";
import type { Order, OrderItem, User, Promotion, SavedAddress, Notification, Review } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

type Tab = "home" | "orders" | "offers" | "profile";

function StatusTimeline({ status }: { status: string }) {
  const steps = ORDER_STATUSES;
  const currentIdx = steps.findIndex(s => s.value === status);

  return (
    <div className="flex items-center gap-0 w-full mt-2" data-testid="order-status-timeline">
      {steps.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.value} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mx-auto ${
                  isActive ? "bg-primary" : "bg-muted-foreground/20"
                } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
              />
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-full -mt-[7px] ${isActive && i < currentIdx ? "bg-primary" : "bg-muted-foreground/20"}`} />
            )}
            <p className={`text-[9px] mt-1.5 text-center leading-tight ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PaymentModal({ open, onClose, order }: { open: boolean; onClose: () => void; order: Order | null }) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "success">("input");

  const payMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payments/stk-push", { orderId: order?.id, phone }),
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      setTimeout(() => {
        onClose();
        setStep("input");
        setPhone("");
      }, 2000);
    },
  });

  const handlePay = () => {
    if (!phone || phone.length < 9) return;
    setStep("processing");
    payMutation.mutate();
  };

  const balanceDue = order ? parseFloat(order.balanceDue) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setStep("input"); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Pay Balance
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-payment-amount">
                KES {balanceDue.toLocaleString()}
              </p>
              {order && (
                <p className="text-xs text-muted-foreground mt-1">Order #{order.id.slice(0, 8)}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">M-Pesa</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Lipa na M-Pesa</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
              </div>

              <div>
                <Label className="text-xs">M-Pesa Phone Number</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                  className="mt-1"
                  data-testid="input-payment-phone"
                />
              </div>
            </div>

            <Button
              onClick={handlePay}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!phone || phone.length < 9}
              data-testid="button-pay-now"
            >
              Pay KES {balanceDue.toLocaleString()} via M-Pesa
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold">STK Push Sent</p>
              <p className="text-sm text-muted-foreground mt-1">Check your phone for the M-Pesa prompt</p>
              <p className="text-xs text-muted-foreground mt-2">Enter your M-Pesa PIN to complete</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">KES {balanceDue.toLocaleString()} paid</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: notifs = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const [payOrder, setPayOrder] = useState<Order | null>(null);

  const { data: orders = [] } = useQuery<(Order & { items?: OrderItem[] })[]>({
    queryKey: ["/api/orders/my"],
  });

  const handlePaymentNotif = (notif: Notification) => {
    if (!notif.isRead) markRead.mutate(notif.id);
    const order = orders.find(o => o.id === notif.orderId);
    if (order) setPayOrder(order);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_request": return <CreditCard className="w-4 h-4 text-red-500" />;
      case "order_status": return <Package className="w-4 h-4 text-blue-500" />;
      case "promotion": return <Gift className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifs.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notif.isRead
                      ? "bg-background border-border"
                      : "bg-primary/5 border-primary/20"
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markRead.mutate(notif.id);
                    if (notif.type === "payment_request") handlePaymentNotif(notif);
                  }}
                  data-testid={`notification-${notif.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      {notif.type === "payment_request" && notif.amount && parseFloat(notif.amount) > 0 && (
                        <Button
                          size="sm"
                          className="mt-2 h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={(e) => { e.stopPropagation(); handlePaymentNotif(notif); }}
                          data-testid={`button-pay-notif-${notif.id}`}
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Pay KES {parseFloat(notif.amount).toLocaleString()}
                        </Button>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentModal open={!!payOrder} onClose={() => setPayOrder(null)} order={payOrder} />
    </>
  );
}

function HomeTab({ user, orders }: { user: User; orders: (Order & { items?: OrderItem[] })[] }) {
  const [, navigate] = useLocation();
  const { data: promos = [] } = useQuery<Promotion[]>({ queryKey: ["/api/promotions/my"] });
  const [payOrder, setPayOrder] = useState<Order | null>(null);

  const latestOrder = orders[0];
  const latestStatusInfo = latestOrder ? ORDER_STATUSES.find(s => s.value === latestOrder.status) : null;
  const activeOrders = orders.filter(o => o.status !== "COMPLETED");

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-slate-300 text-sm">Hello, {user.name?.split(" ")[0]}</p>
              <h2 className="text-xl font-sans font-bold mt-0.5" data-testid="text-greeting">Welcome Back</h2>
              <div className="flex items-center gap-1.5 mt-2 bg-white/10 rounded-full px-3 py-1 w-fit">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{user.phone}</span>
              </div>
              {user.tag && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${TAG_COLORS[user.tag] || "bg-gray-200"}`}>
                  {user.tag} Customer
                </span>
              )}
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
              {user.name?.charAt(0)}
            </div>
          </div>
          <div className="flex gap-2 mt-4 relative z-10">
            <Button
              onClick={() => navigate("/book")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex-1"
              data-testid="button-book-cleaning"
            >
              Book Cleaning
            </Button>
          </div>
        </div>
      </motion.div>

      {activeOrders.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold mb-3">Active Orders</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeOrders.map(order => {
              const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
              const hasDue = parseFloat(order.balanceDue) > 0;
              return (
                <Card key={order.id} className="p-4" data-testid={`card-order-${order.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold truncate">Order #{order.id.slice(0, 8)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.[0]?.description || order.items?.[0]?.carpetType || "Carpet cleaning"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  <StatusTimeline status={order.status} />
                  {hasDue && (
                    <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">
                          Balance: KES {parseFloat(order.balanceDue).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => setPayOrder(order)}
                        data-testid={`button-pay-order-${order.id}`}
                      >
                        <CreditCard className="w-3 h-3 mr-1" /> Pay Now
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {promos.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold mb-2">Special Offers</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {promos.map((promo) => (
              <Card
                key={promo.id}
                className="min-w-[200px] p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 flex-shrink-0"
                data-testid={`card-promo-${promo.id}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {promo.isVipOnly && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                  <h4 className="font-semibold text-sm">{promo.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{promo.description}</p>
                {promo.couponCode && (
                  <p className="text-xs font-mono bg-primary/10 px-2 py-1 rounded mb-2 w-fit">
                    Code: {promo.couponCode}
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/book")}
                  data-testid={`button-use-promo-${promo.id}`}
                >
                  Book Now
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate("/customer")}
            data-testid="card-view-orders"
          >
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">My Orders</span>
          </Card>
          <Card
            className="p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors"
            data-testid="card-saved-addresses"
          >
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Saved Addresses</span>
          </Card>
        </div>
      </motion.div>

      <PaymentModal open={!!payOrder} onClose={() => setPayOrder(null)} order={payOrder} />
    </div>
  );
}

function OrdersTab({ orders }: { orders: (Order & { items?: OrderItem[] })[] }) {
  const activeOrders = orders.filter(o => o.status !== "COMPLETED");
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<(Order & { items?: OrderItem[] }) | null>(null);
  const { data: existingReviews = [] } = useQuery<Review[]>({ queryKey: ["/api/reviews/public"] });

  return (
    <div className="space-y-5">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Active ({activeOrders.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeOrders.map((order, i) => {
              const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
              const hasDue = parseFloat(order.balanceDue) > 0;
              return (
                <motion.div key={order.id} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.05 }}>
                  <Card className="p-4" data-testid={`card-order-${order.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold truncate">Order #{order.id.slice(0, 8)}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.[0]?.description || order.items?.[0]?.carpetType}
                        </p>
                        {order.locationName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {order.locationName}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                        {hasDue && (
                          <p className="text-xs text-destructive">Due: KES {parseFloat(order.balanceDue).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <StatusTimeline status={order.status} />
                    {hasDue && (
                      <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">
                            Pay before cleaning begins
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => setPayOrder(order)}
                          data-testid={`button-pay-order-${order.id}`}
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {completedOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Completed ({completedOrders.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {completedOrders.map(order => {
              const hasReview = existingReviews.some((r: any) => r.orderId === order.id);
              return (
                <Card key={order.id} className="p-4 opacity-90" data-testid={`card-order-completed-${order.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.[0]?.description || order.items?.[0]?.carpetType} &middot; {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                      {hasReview ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <Star className="w-2.5 h-2.5 mr-1 fill-amber-400 text-amber-400" /> Reviewed
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setReviewOrder(order)} data-testid={`button-review-${order.id}`}>
                          <Star className="w-3 h-3 mr-1" /> Rate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-sans text-lg font-bold mb-2" data-testid="text-empty-title">No Orders Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Book your first carpet cleaning today!</p>
        </motion.div>
      )}

      <PaymentModal open={!!payOrder} onClose={() => setPayOrder(null)} order={payOrder} />
      <ReviewDialog open={!!reviewOrder} onClose={() => setReviewOrder(null)} order={reviewOrder} />
    </div>
  );
}

function ReviewDialog({ open, onClose, order }: { open: boolean; onClose: () => void; order: (Order & { items?: OrderItem[] }) | null }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const submitReview = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reviews", { orderId: order?.id, rating, comment }),
    onSuccess: () => {
      toast({ title: "Thank you!", description: "Your review has been submitted." });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      setRating(0);
      setComment("");
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit review", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-sans">Rate Your Experience</DialogTitle>
        </DialogHeader>
        {order && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            <div className="flex items-center gap-1 justify-center" data-testid="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${(hover || rating) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Tell us about your experience (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="min-h-[80px]"
              data-testid="input-review-comment"
            />
            <Button
              className="w-full"
              disabled={rating === 0 || submitReview.isPending}
              onClick={() => submitReview.mutate()}
              data-testid="button-submit-review"
            >
              {submitReview.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OffersTab({ user }: { user: User }) {
  const { data: promos = [], isLoading } = useQuery<Promotion[]>({ queryKey: ["/api/promotions/my"] });
  const [, navigate] = useLocation();

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Available Offers</h3>
      {promos.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No offers available right now</p>
          <p className="text-xs text-muted-foreground mt-1">Keep ordering to unlock more offers!</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {promos.map(promo => {
          const daysLeft = promo.expiresAt ? Math.ceil((new Date(promo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          return (
            <Card key={promo.id} className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid={`card-offer-${promo.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{promo.name}</h4>
                    {promo.isVipOnly && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700"><Shield className="w-2.5 h-2.5 mr-0.5" /> VIP</Badge>}
                    {promo.isActive && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Active</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                  {promo.couponCode && (
                    <p className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded mt-2 w-fit border">
                      {promo.couponCode}
                    </p>
                  )}
                  {daysLeft !== null && daysLeft > 0 && (
                    <p className="text-xs text-primary mt-2 font-medium">Expires in {daysLeft} day{daysLeft > 1 ? "s" : ""}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="ml-3"
                  onClick={() => navigate("/book")}
                  data-testid={`button-apply-offer-${promo.id}`}
                >
                  Use Offer
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");

  const { data: addresses = [] } = useQuery<SavedAddress[]>({ queryKey: ["/api/saved-addresses"] });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressValue, setAddressValue] = useState("");

  const updateProfile = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/auth/profile", { name, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditing(false);
    },
  });

  const addAddress = useMutation({
    mutationFn: () => apiRequest("POST", "/api/saved-addresses", { label: addressLabel, address: addressValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-addresses"] });
      setShowAddAddress(false);
      setAddressLabel("");
      setAddressValue("");
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/saved-addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/saved-addresses"] }),
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-2xl">
            {user.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-sans font-bold text-lg" data-testid="text-profile-name">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            {user.tag && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${TAG_COLORS[user.tag] || "bg-gray-200"}`}>
                {user.tag}
              </span>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} data-testid="input-profile-name" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} data-testid="input-profile-email" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} data-testid="button-save-profile">
                {updateProfile.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {user.email && <p className="text-sm text-muted-foreground">Email: {user.email}</p>}
            <p className="text-sm text-muted-foreground">Total Orders: {user.totalOrders}</p>
            <p className="text-sm text-muted-foreground">Lifetime Value: KES {parseFloat(user.lifetimeValue).toLocaleString()}</p>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-profile">
              <Edit3 className="w-3 h-3 mr-1" /> Edit Profile
            </Button>
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Saved Addresses</h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddAddress(true)} data-testid="button-add-address">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>

        {showAddAddress && (
          <Card className="p-4 space-y-3 mb-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="Home, Office..." data-testid="input-address-label" />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={addressValue} onChange={e => setAddressValue(e.target.value)} placeholder="Full address..." data-testid="input-address-value" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addAddress.mutate()} disabled={addAddress.isPending} data-testid="button-save-address">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddAddress(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {addresses.map(addr => (
            <Card key={addr.id} className="p-3 flex items-center justify-between" data-testid={`card-address-${addr.id}`}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{addr.label}</p>
                  <p className="text-xs text-muted-foreground">{addr.address}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => deleteAddress.mutate(addr.id)}>
                Remove
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full text-destructive border-destructive/20" onClick={() => logout.mutate()} data-testid="button-logout">
        Sign Out
      </Button>
    </div>
  );
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showNotifs, setShowNotifs] = useState(false);
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items?: OrderItem[] })[]>({
    queryKey: ["/api/orders/my"],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });

  if (userLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "orders", label: "Orders", icon: Package },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src="/logo-clear.png" alt="Sparkle n' Glee" className="h-9 w-auto drop-shadow-sm" />
            <span className="text-sm font-bold text-primary">
              Sparkle n' Glee
            </span>
          </div>
          <button
            className="relative p-2 rounded-full hover:bg-accent transition-colors"
            onClick={() => setShowNotifs(true)}
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" data-testid="badge-unread-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-5 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" user={user} orders={orders} />}
          {activeTab === "orders" && <OrdersTab key="orders" orders={orders} />}
          {activeTab === "offers" && <OffersTab key="offers" user={user} />}
          {activeTab === "profile" && <ProfileTab key="profile" user={user} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50" data-testid="bottom-navigation">
        <div className="max-w-5xl mx-auto flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <NotificationsPanel open={showNotifs} onClose={() => setShowNotifs(false)} />
    </div>
  );
}
