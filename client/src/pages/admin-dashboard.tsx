import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, LogOut, Package, DollarSign, MapPin, Users, Clock, Truck,
  Plus, Trash2, Lock, Unlock, Loader2, Bell, Tag, Eye,
  ChevronRight, UserCheck, UserX, CheckCircle2, XCircle, Calendar,
  TrendingUp, Briefcase, BarChart3, Image, Upload, ToggleLeft, ToggleRight,
  Star, Edit3, X, Phone, Mail, Camera
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES, CARPET_TYPES, TAG_COLORS } from "@shared/schema";
import type { Order, OrderItem, OrderPhoto, PricingRule, DeliveryZone, User, Delivery, Promotion, Notification, Media } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

function AdminNotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: notifications = [] } = useQuery<Notification[]>({
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

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notifications
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
          )}
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border text-sm ${notif.isRead ? "bg-muted/30" : "bg-primary/5 border-primary/20"}`}
              data-testid={`notif-admin-${notif.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString("en-KE")}
                  </p>
                </div>
                {!notif.isRead && (
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] shrink-0" onClick={() => markRead.mutate(notif.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailDialog({ open, onClose, order }: { open: boolean; onClose: () => void; order: (Order & { customer?: User }) | null }) {
  const { toast } = useToast();
  const [newPrice, setNewPrice] = useState("");

  const { data: photos = [] } = useQuery<OrderPhoto[]>({
    queryKey: ["/api/orders", order?.id, "photos"],
    queryFn: () => fetch(`/api/orders/${order?.id}/photos`, { credentials: "include" }).then(r => r.json()),
    enabled: !!order?.id && open,
  });

  const { data: items = [] } = useQuery<OrderItem[]>({
    queryKey: ["/api/orders", order?.id, "items"],
    queryFn: () => fetch(`/api/orders/${order?.id}`, { credentials: "include" }).then(r => r.json()).then(d => d.items || []),
    enabled: !!order?.id && open,
  });

  const adjustPrice = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/orders/${order?.id}/price`, { totalAmount: newPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Price adjusted", description: "Customer has been notified of updated balance." });
      setNewPrice("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Order #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold">
              {order.customer?.name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-semibold text-sm">{order.customer?.name}</p>
              <p className="text-xs text-muted-foreground">{order.customer?.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">KES {parseFloat(order.totalAmount).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Balance Due:</span> <span className="font-bold text-red-600">KES {parseFloat(order.balanceDue).toLocaleString()}</span></div>
            <div><span className="text-muted-foreground">Deposit:</span> KES {parseFloat(order.depositPaid).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Status:</span> {order.status}</div>
            {order.locationName && <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {order.locationName}</div>}
            {order.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {order.notes}</div>}
          </div>

          {photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Camera className="w-4 h-4" /> Customer Photos</h4>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={photo.fileKey} alt={photo.photoType} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <h4 className="text-sm font-semibold mb-2">Adjust Price</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="New total (KES)"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="flex-1"
                data-testid="input-adjust-price"
              />
              <Button
                size="sm"
                disabled={!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0 || adjustPrice.isPending}
                onClick={() => adjustPrice.mutate()}
                data-testid="button-adjust-price"
              >
                {adjustPrice.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Update
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">This will update the balance due and notify the customer.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrdersTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<(Order & { customer?: User }) | null>(null);

  const { data: orders = [], isLoading } = useQuery<(Order & { customer?: User })[]>({
    queryKey: ["/api/admin/orders"],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Status Updated" });
    },
  });

  const toggleLock = useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/lock`, { isLocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order Updated" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const filtered = statusFilter === "ALL" ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1" data-testid="order-status-filters">
        <Button size="sm" variant={statusFilter === "ALL" ? "default" : "outline"} className="h-7 text-xs shrink-0" onClick={() => setStatusFilter("ALL")} data-testid="filter-all">
          All ({orders.length})
        </Button>
        {ORDER_STATUSES.map(s => {
          const count = orders.filter(o => o.status === s.value).length;
          return (
            <Button key={s.value} size="sm" variant={statusFilter === s.value ? "default" : "outline"} className="h-7 text-xs shrink-0" onClick={() => setStatusFilter(s.value)} data-testid={`filter-${s.value}`}>
              {s.label} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.map(order => {
        const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
        const customer = order.customer;
        return (
          <Card key={order.id} className="p-4" data-testid={`card-admin-order-${order.id}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {customer?.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{customer?.name || "Unknown"}</p>
                  {customer?.tag && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[customer.tag]}`}>
                      {customer.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{customer?.phone}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customer?.totalOrders || 0} Orders, KES {parseFloat(customer?.lifetimeValue || "0").toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                <p className="text-sm font-bold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
              <Select value={order.status} onValueChange={v => updateStatus.mutate({ id: order.id, status: v })}>
                <SelectTrigger className="w-[140px] h-7 text-xs" data-testid={`select-status-${order.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleLock.mutate({ id: order.id, isLocked: !order.isLocked })} data-testid={`button-lock-${order.id}`}>
                {order.isLocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {order.isLocked ? "Unlock" : "Lock"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedOrder(order)} data-testid={`button-view-details-${order.id}`}>
                <Eye className="w-3 h-3 mr-1" /> Details
              </Button>
            </div>
          </Card>
        );
      })}

      <OrderDetailDialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </div>
  );
}

function DeliveriesTab() {
  const { toast } = useToast();
  const { data: allDeliveries = [], isLoading } = useQuery<(Delivery & { order?: Order; technician?: User })[]>({
    queryKey: ["/api/admin/deliveries"],
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/deliveries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Delivery Status Updated" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_transit: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-3">
      {allDeliveries.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No deliveries yet</p>
        </div>
      )}
      {allDeliveries.map(delivery => (
        <Card key={delivery.id} className="p-4" data-testid={`card-delivery-${delivery.id}`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold capitalize">{delivery.deliveryType}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[delivery.status]}`}>
                  {delivery.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Order #{delivery.orderId.slice(0, 8)}
                {delivery.technician && ` - ${delivery.technician.name}`}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {delivery.scheduledDate && (
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(delivery.scheduledDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                </p>
              )}
              {delivery.scheduledTimeWindow && <p>{delivery.scheduledTimeWindow}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Select value={delivery.status} onValueChange={v => updateDeliveryStatus.mutate({ id: delivery.id, status: v })}>
              <SelectTrigger className="w-[130px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", phone: "", email: "", role: "customer", tag: "" });

  const { data: customers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: string | null }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/tag`, { tag });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Customer Tag Updated" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Customer Status Updated" });
    },
  });

  const addUser = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/users", userForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User Created" });
      setShowAddUser(false);
      setUserForm({ name: "", phone: "", email: "", role: "customer", tag: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deactivated" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Users ({customers.length})</h3>
        <Button size="sm" onClick={() => setShowAddUser(!showAddUser)} data-testid="button-add-user">
          <Plus className="w-3 h-3 mr-1" /> Add User
        </Button>
      </div>

      {showAddUser && (
        <Card className="p-4 space-y-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} placeholder="Full Name" data-testid="input-user-name" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} placeholder="07XX XXX XXX" data-testid="input-user-phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email (optional)</Label>
              <Input value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@example.com" data-testid="input-user-email" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addUser.mutate()} disabled={addUser.isPending} data-testid="button-save-user">
              {addUser.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {customers.map(customer => (
        <Card key={customer.id} className={`p-4 ${!customer.isActive ? "opacity-50" : ""}`} data-testid={`card-customer-${customer.id}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {customer.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">{customer.name}</p>
                <Badge variant="outline" className="text-[10px]">{customer.role}</Badge>
                {customer.tag && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[customer.tag]}`}>
                    {customer.tag}
                  </span>
                )}
                {!customer.isActive && (
                  <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{customer.phone}</p>
              <p className="text-xs text-muted-foreground">
                {customer.totalOrders} orders, KES {parseFloat(customer.lifetimeValue).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-bold">KES {parseFloat(customer.lifetimeValue).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <Select value={customer.tag || "none"} onValueChange={v => updateTag.mutate({ id: customer.id, tag: v === "none" ? null : v })}>
              <SelectTrigger className="w-[120px] h-7 text-xs" data-testid={`select-tag-${customer.id}`}>
                <SelectValue placeholder="Set Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Tag</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Frequent">Frequent</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="One-time">One-time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleActive.mutate({ id: customer.id, isActive: !customer.isActive })}
              data-testid={`button-toggle-active-${customer.id}`}
            >
              {customer.isActive ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
              {customer.isActive ? "Ban" : "Unban"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive"
              onClick={() => deleteUser.mutate(customer.id)}
              data-testid={`button-delete-user-${customer.id}`}
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PricingZonesTab() {
  const { toast } = useToast();
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [pricingForm, setPricingForm] = useState({ name: "", carpetType: "", pricePerSqMeter: "", description: "" });
  const [zoneForm, setZoneForm] = useState({ name: "", fee: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", pricePerSqMeter: "", description: "" });

  const { data: rules = [] } = useQuery<PricingRule[]>({ queryKey: ["/api/pricing"] });
  const { data: zones = [] } = useQuery<DeliveryZone[]>({ queryKey: ["/api/delivery-zones"] });

  const createRule = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/pricing", { ...pricingForm, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing Rule Created" });
      setShowAddPricing(false);
      setPricingForm({ name: "", carpetType: "", pricePerSqMeter: "", description: "" });
    },
  });

  const updateRule = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/pricing/${id}`, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing Rule Updated" });
      setEditingRule(null);
    },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing Rule Deleted" });
    },
  });

  const createZone = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/delivery-zones", { ...zoneForm, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({ title: "Zone Created" });
      setShowAddZone(false);
      setZoneForm({ name: "", fee: "", description: "" });
    },
  });

  const deleteZone = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/delivery-zones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({ title: "Zone Deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Pricing Rules</h3>
          <Button size="sm" onClick={() => setShowAddPricing(!showAddPricing)} data-testid="button-add-pricing">
            <Plus className="w-3 h-3 mr-1" /> Add Rule
          </Button>
        </div>

        {showAddPricing && (
          <Card className="p-4 space-y-3 mb-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={pricingForm.name} onChange={e => setPricingForm({ ...pricingForm, name: e.target.value })} placeholder="Standard Clean" data-testid="input-rule-name" />
              </div>
              <div>
                <Label className="text-xs">Carpet Type</Label>
                <Select value={pricingForm.carpetType} onValueChange={v => setPricingForm({ ...pricingForm, carpetType: v })}>
                  <SelectTrigger data-testid="select-rule-carpet-type"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CARPET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Price per m² (KES)</Label>
              <Input type="number" value={pricingForm.pricePerSqMeter} onChange={e => setPricingForm({ ...pricingForm, pricePerSqMeter: e.target.value })} placeholder="500" data-testid="input-rule-price" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createRule.mutate()} disabled={createRule.isPending} data-testid="button-save-rule">
                {createRule.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddPricing(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {rules.map(rule => (
          <Card key={rule.id} className="p-3 mb-2" data-testid={`card-pricing-${rule.id}`}>
            {editingRule === rule.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={editForm.pricePerSqMeter} onChange={e => setEditForm({ ...editForm, pricePerSqMeter: e.target.value })} className="h-8 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => updateRule.mutate(rule.id)} data-testid={`button-save-edit-${rule.id}`}>
                    {updateRule.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Save
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingRule(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">{rule.carpetType} — KES {parseFloat(rule.pricePerSqMeter).toLocaleString()}/m²</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingRule(rule.id); setEditForm({ name: rule.name, pricePerSqMeter: rule.pricePerSqMeter, description: rule.description || "" }); }} data-testid={`button-edit-rule-${rule.id}`}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule.mutate(rule.id)} data-testid={`button-delete-rule-${rule.id}`}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Delivery Zones</h3>
          <Button size="sm" onClick={() => setShowAddZone(!showAddZone)} data-testid="button-add-zone">
            <Plus className="w-3 h-3 mr-1" /> Add Zone
          </Button>
        </div>

        {showAddZone && (
          <Card className="p-4 space-y-3 mb-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Zone Name</Label>
                <Input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Westlands" data-testid="input-zone-name" />
              </div>
              <div>
                <Label className="text-xs">Fee (KES)</Label>
                <Input type="number" value={zoneForm.fee} onChange={e => setZoneForm({ ...zoneForm, fee: e.target.value })} placeholder="500" data-testid="input-zone-fee" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createZone.mutate()} disabled={createZone.isPending} data-testid="button-save-zone">
                {createZone.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddZone(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {zones.map(zone => (
          <Card key={zone.id} className="p-3 mb-2 flex items-center justify-between" data-testid={`card-zone-${zone.id}`}>
            <div>
              <p className="text-sm font-medium">{zone.name}</p>
              <p className="text-xs text-muted-foreground">KES {parseFloat(zone.fee).toLocaleString()}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteZone.mutate(zone.id)} data-testid={`button-delete-zone-${zone.id}`}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PromotionsTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", promoType: "percentage" as string, appliesTo: "order" as string,
    discountValue: "", couponCode: "", isVipOnly: false, isSingleUse: false,
    expiresAt: "", minOrders: "0", targetTag: "" as string,
  });

  const { data: promos = [], isLoading } = useQuery<Promotion[]>({ queryKey: ["/api/admin/promotions"] });

  const createPromo = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/promotions", {
      ...form,
      discountValue: form.discountValue || null,
      couponCode: form.couponCode || null,
      expiresAt: form.expiresAt || null,
      minOrders: parseInt(form.minOrders) || 0,
      targetTag: form.targetTag && form.targetTag !== "all" ? form.targetTag : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Promotion Created" });
      setShowAdd(false);
      setForm({ name: "", description: "", promoType: "percentage", appliesTo: "order", discountValue: "", couponCode: "", isVipOnly: false, isSingleUse: false, expiresAt: "", minOrders: "0", targetTag: "" });
    },
  });

  const deletePromo = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Promotion Deleted" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Promotions</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-create-coupon">
          <Plus className="w-3 h-3 mr-1" /> Create Coupon
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Summer Sale" data-testid="input-promo-name" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.promoType} onValueChange={v => setForm({ ...form, promoType: v })}>
                <SelectTrigger data-testid="select-promo-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="free_pickup">Free Pickup</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="10% off for new customers" data-testid="input-promo-desc" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(form.promoType === "percentage" || form.promoType === "fixed") && (
              <div>
                <Label className="text-xs">Discount Value {form.promoType === "percentage" ? "(%)" : "(KES)"}</Label>
                <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} data-testid="input-promo-value" />
              </div>
            )}
            <div>
              <Label className="text-xs">Coupon Code (optional)</Label>
              <Input value={form.couponCode} onChange={e => setForm({ ...form, couponCode: e.target.value })} placeholder="SUMMER10" data-testid="input-promo-code" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Expires At (optional)</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} data-testid="input-promo-expiry" />
            </div>
            <div>
              <Label className="text-xs">Min. Orders Required</Label>
              <Input type="number" min="0" value={form.minOrders} onChange={e => setForm({ ...form, minOrders: e.target.value })} placeholder="0" data-testid="input-promo-min-orders" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Target Customer Tag (optional)</Label>
            <Select value={form.targetTag} onValueChange={v => setForm({ ...form, targetTag: v })}>
              <SelectTrigger data-testid="select-promo-target-tag"><SelectValue placeholder="All Customers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="VIP">VIP Only</SelectItem>
                <SelectItem value="Frequent">Frequent Only</SelectItem>
                <SelectItem value="Corporate">Corporate Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.isVipOnly} onChange={e => setForm({ ...form, isVipOnly: e.target.checked })} className="rounded" />
              VIP Only
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.isSingleUse} onChange={e => setForm({ ...form, isSingleUse: e.target.checked })} className="rounded" />
              Single Use
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createPromo.mutate()} disabled={createPromo.isPending} data-testid="button-save-promo">
              {createPromo.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />} Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {promos.map(promo => {
        const daysLeft = promo.expiresAt ? Math.ceil((new Date(promo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        return (
          <Card key={promo.id} className="p-4" data-testid={`card-promo-${promo.id}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold">{promo.name}</p>
                  <Badge variant={promo.isActive ? "default" : "secondary"} className="text-[10px]">
                    {promo.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {promo.isVipOnly && <Badge variant="outline" className="text-[10px]">VIP</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{promo.description}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {promo.couponCode && (
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{promo.couponCode}</span>
                  )}
                  {(promo.minOrders ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px]">Min {promo.minOrders} orders</Badge>
                  )}
                  {promo.targetTag && (
                    <Badge variant="outline" className="text-[10px]">{promo.targetTag} only</Badge>
                  )}
                  {daysLeft !== null && daysLeft > 0 && (
                    <span className="text-xs text-primary font-medium">{daysLeft} Days</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePromo.mutate(promo.id)} data-testid={`button-delete-promo-${promo.id}`}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MediaCMSTab() {
  const { toast } = useToast();
  const { data: media = [], isLoading } = useQuery<Media[]>({ queryKey: ["/api/admin/media"] });
  const [uploading, setUploading] = useState(false);

  const togglePublic = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      apiRequest("PATCH", `/api/admin/media/${id}/public`, { isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "Visibility Updated" });
    },
  });

  const deleteMedia = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "Media Deleted" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
        credentials: "include",
      });
      const data = await res.json();
      await apiRequest("POST", "/api/admin/media", {
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileKey: data.fileKey,
        mimeType: file.type,
        category: "general",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "Media Uploaded" });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Media Library ({media.length})</h3>
        <label className="cursor-pointer">
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} data-testid="input-media-upload" />
          <Button size="sm" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
              Upload
            </span>
          </Button>
        </label>
      </div>

      <p className="text-xs text-muted-foreground">Toggle items to "Public" to display on the landing page gallery.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {media.map(item => {
          const isPublic = item.category === "public";
          return (
            <Card key={item.id} className="overflow-hidden" data-testid={`card-media-${item.id}`}>
              <div className="aspect-video bg-muted relative">
                {item.mimeType.startsWith("image") ? (
                  <img src={item.fileKey} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.fileKey} className="w-full h-full object-cover" />
                )}
                {isPublic && (
                  <Badge className="absolute top-1 right-1 text-[10px] bg-green-600">Public</Badge>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => togglePublic.mutate({ id: item.id, isPublic: !isPublic })}
                    data-testid={`button-toggle-public-${item.id}`}
                  >
                    {isPublic ? <ToggleRight className="w-3 h-3 mr-1 text-green-600" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                    {isPublic ? "Public" : "Private"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMedia.mutate(item.id)} data-testid={`button-delete-media-${item.id}`}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {media.length === 0 && (
        <div className="text-center py-12">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No media uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload before/after photos for your landing page gallery</p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const { data: stats } = useQuery<{
    totalUsers: number; totalOrders: number; scheduledDeliveries: number; activePromotions: number;
    total: number; pending: number; inProgress: number; completed: number; revenue: number;
    activeJobs?: number; topCarpetTypes?: { type: string; count: number }[];
  }>({ queryKey: ["/api/admin/stats/extended"] });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">Admin Panel</p>
              <p className="text-[10px] text-slate-400">Manage Everything</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setShowNotifs(true)}
              data-testid="button-admin-notifications"
            >
              <Bell className="w-5 h-5 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" data-testid="badge-admin-unread">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => logout.mutate()} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 py-5 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 opacity-80" />
              <p className="text-[10px] opacity-80">Total Revenue</p>
            </div>
            <p className="text-xl font-bold" data-testid="text-stat-revenue">
              KES {(stats?.revenue ?? 0).toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 opacity-80" />
              <p className="text-[10px] opacity-80">Active Jobs</p>
            </div>
            <p className="text-xl font-bold" data-testid="text-stat-active-jobs">
              {stats?.activeJobs ?? 0}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 opacity-80" />
              <p className="text-[10px] opacity-80">Total Users</p>
            </div>
            <p className="text-xl font-bold" data-testid="text-stat-users">
              {stats?.totalUsers ?? 0}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 opacity-80" />
              <p className="text-[10px] opacity-80">Total Orders</p>
            </div>
            <p className="text-xl font-bold" data-testid="text-stat-orders">
              {stats?.totalOrders ?? 0}
            </p>
          </Card>
        </div>

        {stats?.topCarpetTypes && stats.topCarpetTypes.length > 0 && (
          <Card className="p-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Most Booked Carpet Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.topCarpetTypes.map((ct, i) => (
                <Badge key={ct.type} variant={i === 0 ? "default" : "secondary"} className="text-xs" data-testid={`badge-carpet-type-${ct.type}`}>
                  {ct.type}: {ct.count}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <Tabs defaultValue="orders">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto" data-testid="tabs-admin">
            <TabsTrigger value="orders" data-testid="tab-orders" className="text-xs">
              <Package className="w-3 h-3 mr-1" /> Orders
            </TabsTrigger>
            <TabsTrigger value="deliveries" data-testid="tab-deliveries" className="text-xs">
              <Truck className="w-3 h-3 mr-1" /> Deliveries
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="text-xs">
              <Users className="w-3 h-3 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="pricing" data-testid="tab-pricing" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" /> Pricing & Zones
            </TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions" className="text-xs">
              <Tag className="w-3 h-3 mr-1" /> Promotions
            </TabsTrigger>
            <TabsTrigger value="media" data-testid="tab-media" className="text-xs">
              <Image className="w-3 h-3 mr-1" /> Media CMS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="deliveries"><DeliveriesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="pricing"><PricingZonesTab /></TabsContent>
          <TabsContent value="promotions"><PromotionsTab /></TabsContent>
          <TabsContent value="media"><MediaCMSTab /></TabsContent>
        </Tabs>
      </div>

      <AdminNotificationsPanel open={showNotifs} onClose={() => setShowNotifs(false)} />
    </div>
  );
}
