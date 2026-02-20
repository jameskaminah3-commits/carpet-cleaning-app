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
import { Switch } from "@/components/ui/switch";
import {
  Sparkles, LogOut, Package, DollarSign, MapPin, Image, Users, Clock,
  Plus, Pencil, Trash2, Lock, Unlock, ChevronRight, Loader2, BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ORDER_STATUSES, CARPET_TYPES } from "@shared/schema";
import type { Order, PricingRule, DeliveryZone, User } from "@shared/schema";

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

  const updatePrice = useMutation({
    mutationFn: async ({ id, totalAmount }: { id: string; totalAmount: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${id}/price`, { totalAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Price Updated" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground" data-testid="text-no-orders">No orders yet</p>
        </div>
      )}
      {orders.map((order) => {
        const statusInfo = ORDER_STATUSES.find((s) => s.value === order.status) || ORDER_STATUSES[0];
        return (
          <Card key={order.id} className="p-4" data-testid={`card-admin-order-${order.id}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">#{order.id.slice(0, 8)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {order.isLocked && (
                    <Lock className="w-3 h-3 text-destructive" />
                  )}
                </div>
                {(order as any).customer && (
                  <p className="text-xs text-muted-foreground">{(order as any).customer.name} - {(order as any).customer.phone}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Paid: KES {parseFloat(order.depositPaid).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={order.status}
                onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs" data-testid={`select-status-${order.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleLock.mutate({ id: order.id, isLocked: !order.isLocked })}
                data-testid={`button-lock-${order.id}`}
              >
                {order.isLocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {order.isLocked ? "Unlock" : "Lock"}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid={`button-adjust-price-${order.id}`}>
                    <DollarSign className="w-3 h-3 mr-1" /> Adjust Price
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adjust Order Price</DialogTitle>
                  </DialogHeader>
                  <PriceAdjuster orderId={order.id} currentPrice={order.totalAmount} onSave={updatePrice.mutate} />
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PriceAdjuster({ orderId, currentPrice, onSave }: { orderId: string; currentPrice: string; onSave: (data: { id: string; totalAmount: string }) => void }) {
  const [price, setPrice] = useState(currentPrice);
  return (
    <div className="space-y-4 pt-2">
      <div>
        <Label>New Total Amount (KES)</Label>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} data-testid="input-new-price" />
      </div>
      <Button onClick={() => onSave({ id: orderId, totalAmount: price })} data-testid="button-save-price">
        Save
      </Button>
    </div>
  );
}

function PricingTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", carpetType: "", pricePerSqMeter: "", description: "" });

  const { data: rules = [], isLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/pricing"],
  });

  const createRule = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/pricing", {
        ...form,
        pricePerSqMeter: form.pricePerSqMeter,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing Rule Created" });
      setShowAdd(false);
      setForm({ name: "", carpetType: "", pricePerSqMeter: "", description: "" });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing Rule Deleted" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">Pricing Rules</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-pricing">
          <Plus className="w-3 h-3 mr-1" /> Add Rule
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard Clean" data-testid="input-rule-name" />
            </div>
            <div>
              <Label className="text-xs">Carpet Type</Label>
              <Select value={form.carpetType} onValueChange={(v) => setForm({ ...form, carpetType: v })}>
                <SelectTrigger data-testid="select-rule-carpet-type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CARPET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Price per m² (KES)</Label>
            <Input type="number" value={form.pricePerSqMeter} onChange={(e) => setForm({ ...form, pricePerSqMeter: e.target.value })} placeholder="500" data-testid="input-rule-price" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createRule.mutate()} disabled={createRule.isPending} data-testid="button-save-rule">
              {createRule.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {rules.map((rule) => (
        <Card key={rule.id} className="p-4" data-testid={`card-pricing-${rule.id}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{rule.name}</p>
              <p className="text-xs text-muted-foreground">{rule.carpetType} — KES {parseFloat(rule.pricePerSqMeter).toLocaleString()}/m²</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)} data-testid={`button-delete-rule-${rule.id}`}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ZonesTab() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", fee: "", description: "" });

  const { data: zones = [], isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const createZone = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/delivery-zones", { ...form, fee: form.fee, isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({ title: "Zone Created" });
      setShowAdd(false);
      setForm({ name: "", fee: "", description: "" });
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/delivery-zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({ title: "Zone Deleted" });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">Delivery Zones</h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-zone">
          <Plus className="w-3 h-3 mr-1" /> Add Zone
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Zone Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Westlands" data-testid="input-zone-name" />
            </div>
            <div>
              <Label className="text-xs">Fee (KES)</Label>
              <Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="500" data-testid="input-zone-fee" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => createZone.mutate()} disabled={createZone.isPending} data-testid="button-save-zone">
              {createZone.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {zones.map((zone) => (
        <Card key={zone.id} className="p-4" data-testid={`card-zone-${zone.id}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{zone.name}</p>
              <p className="text-xs text-muted-foreground">KES {parseFloat(zone.fee).toLocaleString()}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteZone.mutate(zone.id)} data-testid={`button-delete-zone-${zone.id}`}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats } = useQuery<{ total: number; pending: number; inProgress: number; completed: number; revenue: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/");
    },
  });

  const statCards = [
    { label: "Total Orders", value: stats?.total ?? 0, icon: Package, color: "text-primary" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "In Progress", value: stats?.inProgress ?? 0, icon: BarChart3, color: "text-blue-500" },
    { label: "Revenue", value: `KES ${(stats?.revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-2 h-16">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {user && <span className="text-xs text-muted-foreground hidden sm:block">{user.name}</span>}
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} data-testid="button-admin-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-lg font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="mb-4" data-testid="tabs-admin">
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="w-3.5 h-3.5 mr-1.5" /> Orders
            </TabsTrigger>
            <TabsTrigger value="pricing" data-testid="tab-pricing">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="zones" data-testid="tab-zones">
              <MapPin className="w-3.5 h-3.5 mr-1.5" /> Zones
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="pricing"><PricingTab /></TabsContent>
          <TabsContent value="zones"><ZonesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
