import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, LogOut, Package, DollarSign, MapPin, Users, Clock, Truck,
  Plus, Trash2, Lock, Unlock, Loader2, Bell, Tag, Eye,
  ChevronRight, UserCheck, UserX, CheckCircle2, XCircle, Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES, CARPET_TYPES, TAG_COLORS } from "@shared/schema";
import type { Order, PricingRule, DeliveryZone, User, Delivery, Promotion } from "@shared/schema";

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

function OrdersTab() {
  const { toast } = useToast();
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="font-medium">Orders</span>
        <span>|</span>
        <span>Deliveries</span>
        <span>|</span>
        <span>{orders.length} total</span>
      </div>
      {orders.map(order => {
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
              {order.status === "READY" && (
                <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: order.id, status: "COMPLETED" })} data-testid={`button-mark-delivered-${order.id}`}>
                  Mark Delivered
                </Button>
              )}
              {parseFloat(order.balanceDue) > 0 && (
                <Button size="sm" variant="secondary" className="h-7 text-xs" data-testid={`button-complete-payment-${order.id}`}>
                  Complete Payment
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" data-testid={`button-view-details-${order.id}`}>
                View Details
              </Button>
            </div>
          </Card>
        );
      })}
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

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Customers ({customers.length})</h3>
      </div>
      {customers.map(customer => (
        <Card key={customer.id} className={`p-4 ${!customer.isActive ? "opacity-50" : ""}`} data-testid={`card-customer-${customer.id}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">{customer.name}</p>
                {customer.tag && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[customer.tag]}`}>
                    {customer.tag}
                  </span>
                )}
                {!customer.isActive && (
                  <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
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
              {customer.isActive ? "Deactivate" : "Activate"}
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
  const [pricingForm, setPricingForm] = useState({ name: "", carpetType: "", pricePerSqMeter: "", description: "" });
  const [zoneForm, setZoneForm] = useState({ name: "", fee: "", description: "" });

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
          <Card key={rule.id} className="p-3 mb-2 flex items-center justify-between" data-testid={`card-pricing-${rule.id}`}>
            <div>
              <p className="text-sm font-medium">{rule.name}</p>
              <p className="text-xs text-muted-foreground">{rule.carpetType} — KES {parseFloat(rule.pricePerSqMeter).toLocaleString()}/m²</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule.mutate(rule.id)} data-testid={`button-delete-rule-${rule.id}`}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
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
    expiresAt: "",
  });

  const { data: promos = [], isLoading } = useQuery<Promotion[]>({ queryKey: ["/api/admin/promotions"] });

  const createPromo = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/promotions", {
      ...form,
      discountValue: form.discountValue || null,
      couponCode: form.couponCode || null,
      expiresAt: form.expiresAt || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Promotion Created" });
      setShowAdd(false);
      setForm({ name: "", description: "", promoType: "percentage", appliesTo: "order", discountValue: "", couponCode: "", isVipOnly: false, isSingleUse: false, expiresAt: "" });
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
          <div>
            <Label className="text-xs">Expires At (optional)</Label>
            <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} data-testid="input-promo-expiry" />
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
                <div className="flex items-center gap-3 mt-1">
                  {promo.couponCode && (
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{promo.couponCode}</span>
                  )}
                  {daysLeft !== null && daysLeft > 0 && (
                    <span className="text-xs text-primary font-medium">{daysLeft} Days</span>
                  )}
                  {promo.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expire: {new Date(promo.expiresAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
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

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const { data: stats } = useQuery<{
    totalUsers: number; totalOrders: number; scheduledDeliveries: number; activePromotions: number;
    total: number; pending: number; inProgress: number; completed: number; revenue: number;
  }>({ queryKey: ["/api/admin/stats"] });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const statCards = [
    { label: "All Users", value: stats?.totalUsers ?? 0, color: "from-emerald-500 to-emerald-600" },
    { label: "All Orders", value: stats?.totalOrders ?? 0, color: "from-blue-500 to-blue-600" },
    { label: "Scheduled\nDeliveries", value: stats?.scheduledDeliveries ?? 0, color: "from-amber-500 to-amber-600" },
    { label: "Current\nPromotions", value: stats?.activePromotions ?? 0, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
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
            <button className="relative" data-testid="button-admin-notifications">
              <Bell className="w-5 h-5 text-slate-400" />
            </button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => logout.mutate()} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-5 flex-1">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {statCards.map(stat => (
            <Card key={stat.label} className={`p-3 bg-gradient-to-br ${stat.color} text-white border-0`}>
              <p className="text-2xl font-bold" data-testid={`text-stat-${stat.label.replace(/\s+/g, '-').replace(/\n/g, '-').toLowerCase()}`}>
                {stat.value}
              </p>
              <p className="text-[10px] opacity-80 whitespace-pre-line leading-tight mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

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
          </TabsList>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="deliveries"><DeliveriesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="pricing"><PricingZonesTab /></TabsContent>
          <TabsContent value="promotions"><PromotionsTab /></TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Card className="p-4 bg-slate-800 text-white cursor-pointer hover:bg-slate-700 transition-colors" data-testid="button-manage-users">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-semibold">Manage Users</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
          <Card className="p-4 bg-slate-800 text-white cursor-pointer hover:bg-slate-700 transition-colors" data-testid="button-create-coupon-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <span className="text-sm font-semibold">Create Coupon</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
