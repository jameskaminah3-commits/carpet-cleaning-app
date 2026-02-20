import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Sparkles, Home, Package, Tag, UserCircle, ChevronRight, MapPin,
  Plus, Edit3, Clock, CheckCircle2, Bell, Phone, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ORDER_STATUSES, TAG_COLORS } from "@shared/schema";
import type { Order, OrderItem, User, Promotion, SavedAddress } from "@shared/schema";

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

function HomeTab({ user, orders }: { user: User; orders: (Order & { items?: OrderItem[] })[] }) {
  const [, navigate] = useLocation();
  const { data: promos = [] } = useQuery<Promotion[]>({ queryKey: ["/api/promotions/my"] });

  const latestOrder = orders[0];
  const latestStatusInfo = latestOrder ? ORDER_STATUSES.find(s => s.value === latestOrder.status) : null;

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-8 translate-x-8" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-slate-300 text-sm">Hello, {user.name?.split(" ")[0]}</p>
              <h2 className="text-xl font-serif font-bold mt-0.5" data-testid="text-greeting">Welcome Back</h2>
              <div className="flex items-center gap-1.5 mt-2 bg-white/10 rounded-full px-3 py-1 w-fit">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{user.phone}</span>
              </div>
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
            {promos.length > 0 && (
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 flex-1"
                data-testid="button-claim-offer"
              >
                Claim {promos[0].promoType === "percentage" ? `${promos[0].discountValue}% Off` : "Offer"}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {latestOrder && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold mb-2">Order History</h3>
          <Card className="p-4" data-testid={`card-latest-order-${latestOrder.id}`}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium">
                    {latestStatusInfo?.label === "Delivered" ? "Delivered Today" : latestStatusInfo?.label}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground ml-4 mt-0.5">
                  {latestOrder.items?.[0]?.description || latestOrder.items?.[0]?.carpetType || "Carpet cleaning"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" data-testid="text-latest-order-total">
                  KES {parseFloat(latestOrder.totalAmount).toLocaleString()}
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${parseFloat(latestOrder.balanceDue) > 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                  {parseFloat(latestOrder.balanceDue) > 0 ? "Balance Due" : "Paid"}
                </span>
              </div>
            </div>
            <StatusTimeline status={latestOrder.status} />
          </Card>
          <button
            onClick={() => navigate("/customer")}
            className="flex items-center justify-between w-full mt-2 px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-view-all-orders"
          >
            View All Orders <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}>
        <h3 className="text-sm font-semibold mb-2">Profile</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors" data-testid="card-edit-profile">
            <Edit3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Edit Profile</span>
          </Card>
          <Card className="p-3 flex items-center gap-2 cursor-pointer hover:bg-accent/50 transition-colors" data-testid="card-saved-addresses">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Saved Addresses</span>
          </Card>
        </div>
      </motion.div>

      {promos.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold mb-2">Special Offers for You</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {promos.map((promo) => (
              <Card
                key={promo.id}
                className="min-w-[200px] p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 flex-shrink-0"
                data-testid={`card-promo-${promo.id}`}
              >
                <h4 className="font-semibold text-sm">{promo.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{promo.description}</p>
                <Button size="sm" className="w-full" data-testid={`button-use-promo-${promo.id}`}>
                  Book Now
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function OrdersTab({ orders }: { orders: (Order & { items?: OrderItem[] })[] }) {
  const activeOrders = orders.filter(o => o.status !== "COMPLETED");
  const completedOrders = orders.filter(o => o.status === "COMPLETED");

  return (
    <div className="space-y-5">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Active ({activeOrders.length})
          </h3>
          <div className="space-y-3">
            {activeOrders.map((order, i) => {
              const statusInfo = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
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
                        {parseFloat(order.balanceDue) > 0 && (
                          <p className="text-xs text-destructive">Due: KES {parseFloat(order.balanceDue).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <StatusTimeline status={order.status} />
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
          <div className="space-y-3">
            {completedOrders.map(order => (
              <Card key={order.id} className="p-4 opacity-75" data-testid={`card-order-completed-${order.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items?.[0]?.description || order.items?.[0]?.carpetType} &middot; {new Date(order.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {parseFloat(order.totalAmount).toLocaleString()}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-primary" data-testid={`button-reorder-${order.id}`}>
                      Reorder
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
        </motion.div>
      )}
    </div>
  );
}

function OffersTab({ userId }: { userId: string }) {
  const { data: promos = [], isLoading } = useQuery<Promotion[]>({ queryKey: ["/api/promotions/my"] });

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Available Offers</h3>
      {promos.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No offers available right now</p>
        </div>
      )}
      {promos.map(promo => {
        const daysLeft = promo.expiresAt ? Math.ceil((new Date(promo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        return (
          <Card key={promo.id} className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid={`card-offer-${promo.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{promo.name}</h4>
                  {promo.isActive && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                {daysLeft !== null && daysLeft > 0 && (
                  <p className="text-xs text-primary mt-2 font-medium">Expires in {daysLeft} day{daysLeft > 1 ? "s" : ""}</p>
                )}
              </div>
              <Button size="sm" className="ml-3" data-testid={`button-apply-offer-${promo.id}`}>Apply</Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ProfileTab({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");

  const { data: addresses = [], isLoading: addressesLoading } = useQuery<SavedAddress[]>({ queryKey: ["/api/saved-addresses"] });
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
            <h3 className="font-serif font-bold text-lg" data-testid="text-profile-name">{user.name}</h3>
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

        {addresses.map(addr => (
          <Card key={addr.id} className="p-3 mb-2 flex items-center justify-between" data-testid={`card-address-${addr.id}`}>
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

      <Button variant="outline" className="w-full text-destructive border-destructive/20" onClick={() => logout.mutate()} data-testid="button-logout">
        Sign Out
      </Button>
    </div>
  );
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<(Order & { items?: OrderItem[] })[]>({
    queryKey: ["/api/orders/my"],
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
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-serif text-sm font-bold">
              <span className="text-muted-foreground">Carpet</span>Pro{" "}
              <span className="italic text-primary">Executive</span>
            </span>
          </div>
          <button className="relative" data-testid="button-notifications">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-5 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" user={user} orders={orders} />}
          {activeTab === "orders" && <OrdersTab key="orders" orders={orders} />}
          {activeTab === "offers" && <OffersTab key="offers" userId={user.id} />}
          {activeTab === "profile" && <ProfileTab key="profile" user={user} />}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50" data-testid="bottom-navigation">
        <div className="max-w-lg mx-auto flex">
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
    </div>
  );
}
