import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, LogOut, Navigation, Camera, CheckCircle2, MapPin, Phone, Loader2, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES } from "@shared/schema";
import type { Order, User } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function TechnicianDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tasks = [], isLoading } = useQuery<(Order & { customer?: User })[]>({
    queryKey: ["/api/technician/tasks"],
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

  const openMaps = (order: Order) => {
    if (order.locationLat && order.locationLng) {
      window.open(`https://maps.google.com/?q=${order.locationLat},${order.locationLng}`, "_blank");
    } else if (order.locationName) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(order.locationName)}`, "_blank");
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const doneTasks = tasks.filter((t) => t.status === "COMPLETED");

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

      <div className="max-w-lg mx-auto w-full px-4 py-6 flex-1">
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
      </div>
    </div>
  );
}
