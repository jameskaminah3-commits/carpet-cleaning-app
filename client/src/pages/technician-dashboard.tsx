import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, LogOut, Navigation, Camera, CheckCircle2, MapPin, Phone, Loader2, Package, Truck, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES } from "@shared/schema";
import type { Order, User, Delivery } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function TechnicianDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"jobs" | "trips">("jobs");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tasks = [], isLoading } = useQuery<(Order & { customer?: User })[]>({
    queryKey: ["/api/technician/tasks"],
  });

  const { data: myDeliveries = [], isLoading: loadingDeliveries } = useQuery<(Delivery & { order?: Order })[]>({
    queryKey: ["/api/technician/deliveries"],
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const completeTask = useMutation({
    mutationFn: async (orderId: string) => {
      await apiRequest("PATCH", `/api/technician/tasks/${orderId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/tasks"] });
      toast({ title: "Job Completed!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const completeDelivery = useMutation({
    mutationFn: async (deliveryId: string) => {
      await apiRequest("PATCH", `/api/technician/deliveries/${deliveryId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/deliveries"] });
      toast({ title: "Trip Completed!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openMaps = (order: Order) => {
    if (order.locationLat && order.locationLng) {
      window.open(`https://maps.google.com/?q=${order.locationLat},${order.locationLng}`, "_blank");
    } else if (order.locationName) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(order.locationName)}`, "_blank");
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const doneTasks = tasks.filter((t) => t.status === "COMPLETED");

  const activeDeliveries = myDeliveries.filter(d => d.status !== "completed");
  const completedDeliveries = myDeliveries.filter(d => d.status === "completed");
  const completedTripsCount = completedDeliveries.length;

  const deliveryStatusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_transit: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between gap-2 h-16">
          <div className="flex items-center gap-2">
            <img src="/logo-clear.png" alt="Sparkle n' Glee" className="h-9 w-auto drop-shadow-sm" />
            <span className="font-sans text-lg font-bold">My Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            {user && <span className="text-xs text-muted-foreground">{user.name}</span>}
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} data-testid="button-tech-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-4 flex-1">
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeView === "jobs" ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-full"
            onClick={() => setActiveView("jobs")}
            data-testid="button-view-jobs"
          >
            <Package className="w-3.5 h-3.5 mr-1" /> Jobs
          </Button>
          <Button
            variant={activeView === "trips" ? "default" : "outline"}
            size="sm"
            className="flex-1 rounded-full"
            onClick={() => setActiveView("trips")}
            data-testid="button-view-trips"
          >
            <Truck className="w-3.5 h-3.5 mr-1" /> Trips
            {completedTripsCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0" data-testid="badge-trip-count">
                {completedTripsCount}
              </Badge>
            )}
          </Button>
        </div>

        {activeView === "jobs" && (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {activeTasks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Active Jobs ({activeTasks.length})
                    </h2>
                    <div className="space-y-3">
                      {activeTasks.map((task, i) => {
                        const statusInfo = ORDER_STATUSES.find((s) => s.value === task.status) || ORDER_STATUSES[0];
                        const customer = (task as any).customer;
                        return (
                          <motion.div
                            key={task.id}
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="p-4" data-testid={`card-task-${task.id}`}>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">#{task.id.slice(0, 8)}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  {customer && (
                                    <p className="text-xs text-muted-foreground">{customer.name}</p>
                                  )}
                                </div>
                                <p className="font-bold text-sm shrink-0">
                                  KES {parseFloat(task.totalAmount).toLocaleString()}
                                </p>
                              </div>

                              {task.locationName && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{task.locationName}</span>
                                  {task.pickupAddress && <span>- {task.pickupAddress}</span>}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {(task.locationName || task.locationLat) && (
                                  <Button variant="outline" size="sm" onClick={() => openMaps(task)} data-testid={`button-navigate-${task.id}`}>
                                    <Navigation className="w-3 h-3 mr-1" /> Navigate
                                  </Button>
                                )}
                                {customer?.phone && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(`tel:${customer.phone}`)}>
                                    <Phone className="w-3 h-3 mr-1" /> Call
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => completeTask.mutate(task.id)}
                                  disabled={completeTask.isPending}
                                  data-testid={`button-complete-${task.id}`}
                                >
                                  {completeTask.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                  )}
                                  Complete Job
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {doneTasks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Completed ({doneTasks.length})
                    </h2>
                    <div className="space-y-3">
                      {doneTasks.map((task) => (
                        <Card key={task.id} className="p-4 opacity-60" data-testid={`card-task-done-${task.id}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">#{task.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(task.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Package className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-sans text-lg font-bold mb-2" data-testid="text-no-tasks">No Tasks</h3>
                    <p className="text-sm text-muted-foreground">You have no assigned tasks right now.</p>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}

        {activeView === "trips" && (
          <>
            {loadingDeliveries ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="p-4 bg-primary/5 border-primary/20" data-testid="card-trip-summary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Completed Trips</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-total-trips">{completedTripsCount}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="text-center">
                        <ArrowUpCircle className="w-4 h-4 mx-auto mb-0.5 text-blue-500" />
                        <p>{completedDeliveries.filter(d => d.deliveryType === "pickup").length} Pickups</p>
                      </div>
                      <div className="text-center">
                        <ArrowDownCircle className="w-4 h-4 mx-auto mb-0.5 text-green-500" />
                        <p>{completedDeliveries.filter(d => d.deliveryType === "return").length} Drop-offs</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {activeDeliveries.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Active Trips ({activeDeliveries.length})
                    </h2>
                    <div className="space-y-3">
                      {activeDeliveries.map((delivery, i) => (
                        <motion.div
                          key={delivery.id}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="p-4" data-testid={`card-delivery-${delivery.id}`}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {delivery.deliveryType === "pickup" ? (
                                    <Badge className="bg-blue-100 text-blue-700 text-[10px]" data-testid={`badge-type-${delivery.id}`}>
                                      <ArrowUpCircle className="w-3 h-3 mr-1" /> PICKUP
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-700 text-[10px]" data-testid={`badge-type-${delivery.id}`}>
                                      <ArrowDownCircle className="w-3 h-3 mr-1" /> DROP-OFF
                                    </Badge>
                                  )}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${deliveryStatusColors[delivery.status]}`}>
                                    {delivery.status.replace("_", " ")}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">Order #{delivery.orderId.slice(0, 8)}</p>
                              </div>
                              {delivery.scheduledDate && (
                                <div className="text-right text-xs text-muted-foreground">
                                  <p>{new Date(delivery.scheduledDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</p>
                                  {delivery.scheduledTimeWindow && <p>{delivery.scheduledTimeWindow}</p>}
                                </div>
                              )}
                            </div>

                            {delivery.order?.locationName && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{delivery.order.locationName}</span>
                              </div>
                            )}

                            {delivery.notes && (
                              <p className="text-xs text-muted-foreground mb-3 italic">"{delivery.notes}"</p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {delivery.order && (delivery.order.locationName || delivery.order.locationLat) && (
                                <Button variant="outline" size="sm" onClick={() => openMaps(delivery.order!)} data-testid={`button-navigate-delivery-${delivery.id}`}>
                                  <Navigation className="w-3 h-3 mr-1" /> Navigate
                                </Button>
                              )}
                              {delivery.status !== "completed" && (
                                <Button
                                  size="sm"
                                  onClick={() => completeDelivery.mutate(delivery.id)}
                                  disabled={completeDelivery.isPending}
                                  data-testid={`button-complete-delivery-${delivery.id}`}
                                >
                                  {completeDelivery.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                  )}
                                  Complete Trip
                                </Button>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {completedDeliveries.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Completed Trips ({completedDeliveries.length})
                    </h2>
                    <div className="space-y-3">
                      {completedDeliveries.map((delivery) => (
                        <Card key={delivery.id} className="p-3 opacity-60" data-testid={`card-delivery-done-${delivery.id}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {delivery.deliveryType === "pickup" ? (
                                <ArrowUpCircle className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <ArrowDownCircle className="w-3.5 h-3.5 text-green-500" />
                              )}
                              <span className="text-xs font-medium capitalize">{delivery.deliveryType === "pickup" ? "Pickup" : "Drop-off"}</span>
                              <span className="text-xs text-muted-foreground">#{delivery.orderId.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {delivery.completedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(delivery.completedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                                </span>
                              )}
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {myDeliveries.length === 0 && (
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Truck className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="font-sans text-lg font-bold mb-2" data-testid="text-no-trips">No Trips</h3>
                    <p className="text-sm text-muted-foreground">You have no assigned pickup or drop-off trips.</p>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
