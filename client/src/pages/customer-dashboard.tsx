import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Plus, LogOut, Package, Clock, CheckCircle2, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ORDER_STATUSES } from "@shared/schema";
import type { Order, User } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function CustomerDashboard() {
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  };

  const activeOrders = orders.filter((o) => o.status !== "COMPLETED");
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-2 h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-bold">My Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1">
        {userLoading ? (
          <Skeleton className="h-20 rounded-xl mb-6" />
        ) : user ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="p-5 mb-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back,</p>
                  <p className="text-lg font-serif font-bold" data-testid="text-user-name">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.phone}</p>
                </div>
                <Button onClick={() => navigate("/book")} data-testid="button-new-order">
                  <Plus className="w-4 h-4 mr-2" /> New Order
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Active Orders ({activeOrders.length})
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order, i) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="p-4 hover-elevate cursor-pointer" onClick={() => navigate(`/customer/order/${order.id}`)} data-testid={`card-order-${order.id}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold truncate">Order #{order.id.slice(0, 8)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              {order.locationName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {order.locationName}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm" data-testid={`text-order-total-${order.id}`}>
                                KES {parseFloat(order.totalAmount).toLocaleString()}
                              </p>
                              {parseFloat(order.balanceDue) > 0 && (
                                <p className="text-xs text-destructive">
                                  Due: KES {parseFloat(order.balanceDue).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Completed ({completedOrders.length})
                </h2>
                <div className="space-y-3">
                  {completedOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <Card key={order.id} className="p-4 opacity-70" data-testid={`card-order-completed-${order.id}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
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
                <h3 className="font-serif text-lg font-bold mb-2" data-testid="text-empty-title">No Orders Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Book your first carpet cleaning today!</p>
                <Button onClick={() => navigate("/book")} data-testid="button-first-order">
                  <Plus className="w-4 h-4 mr-2" /> Book Cleaning
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
