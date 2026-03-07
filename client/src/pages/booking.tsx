import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, ArrowRight, Plus, X, MapPin, Camera, Loader2, CheckCircle2, Calculator, Tag, Gift, Truck, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CARPET_TYPES } from "@shared/schema";
import type { PricingRule, DeliveryZone, User, Promotion } from "@shared/schema";

interface CarpetItem {
  carpetType: string;
  width: string;
  length: string;
  quantity: string;
  description: string;
}

const emptyItem: CarpetItem = {
  carpetType: "",
  width: "",
  length: "",
  quantity: "1",
  description: "",
};

function getItemEstimate(item: CarpetItem, pricing: PricingRule[]) {
  const w = parseFloat(item.width) || 0;
  const l = parseFloat(item.length) || 0;
  const qty = parseInt(item.quantity) || 1;
  const rule = pricing.find((p) => p.carpetType === item.carpetType);
  const pricePerSqM = rule ? parseFloat(rule.pricePerSqMeter) : 0;
  const area = w * l;
  return { area, pricePerSqM, qty, subtotal: area * pricePerSqM * qty };
}

export default function BookingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<CarpetItem[]>([{ ...emptyItem }]);
  const [pickupOption, setPickupOption] = useState<"customer_delivers" | "request_pickup">("customer_delivers");
  const [returnOption, setReturnOption] = useState<"customer_collects" | "request_delivery">("customer_collects");
  const [selectedZone, setSelectedZone] = useState("");
  const [address, setAddress] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [couponError, setCouponError] = useState("");

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: pricing = [], isLoading: pricingLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/pricing"],
  });

  const { data: zones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const validateCoupon = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/promotions/validate", { code: couponCode.trim() });
      return res.json();
    },
    onSuccess: (promo: Promotion) => {
      setAppliedPromo(promo);
      setCouponError("");
      toast({ title: "Coupon Applied!", description: promo.description || promo.name });
    },
    onError: (err: Error) => {
      setCouponError(err.message || "Invalid coupon code");
      setAppliedPromo(null);
    },
  });

  const needsLocation = pickupOption === "request_pickup" || returnOption === "request_delivery";
  const zone = zones.find((z) => z.id === selectedZone);
  const zoneFee = zone ? parseFloat(zone.fee) : 0;
  const pickupFee = pickupOption === "request_pickup" && zone ? zoneFee : 0;
  const deliveryFee = returnOption === "request_delivery" && zone ? zoneFee : 0;
  const itemsTotal = items.reduce((sum, item) => sum + getItemEstimate(item, pricing).subtotal, 0);

  const getDiscount = () => {
    if (!appliedPromo) return 0;
    const subtotal = itemsTotal;
    if (appliedPromo.promoType === "percentage" && appliedPromo.discountValue) {
      return Math.round(subtotal * (parseFloat(appliedPromo.discountValue) / 100));
    }
    if (appliedPromo.promoType === "fixed" && appliedPromo.discountValue) {
      return Math.min(parseFloat(appliedPromo.discountValue), subtotal);
    }
    if (appliedPromo.promoType === "free_pickup") {
      return pickupFee;
    }
    if (appliedPromo.promoType === "free_delivery") {
      return deliveryFee;
    }
    return 0;
  };

  const grandTotal = Math.max(0, itemsTotal + pickupFee + deliveryFee - getDiscount());

  const createOrder = useMutation({
    mutationFn: async () => {
      const orderItems = items.map((item) => {
        const est = getItemEstimate(item, pricing);
        return {
          carpetType: item.carpetType,
          width: parseFloat(item.width) || 0,
          length: parseFloat(item.length) || 0,
          quantity: est.qty,
          unitPrice: est.pricePerSqM,
          subtotal: est.subtotal,
          description: item.description || undefined,
        };
      });

      const res = await apiRequest("POST", "/api/orders", {
        items: orderItems,
        pickupOption,
        returnOption,
        deliveryZoneId: needsLocation ? selectedZone || undefined : undefined,
        pickupAddress: needsLocation ? address : undefined,
        locationName: needsLocation ? locationName : undefined,
        notes,
        totalAmount: grandTotal,
        promotionId: appliedPromo?.id || undefined,
        discountAmount: getDiscount(),
        pickupFee,
        deliveryFee,
      });
      const order = await res.json();
      if (photos.length > 0 && order?.id) {
        for (const photo of photos) {
          try {
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": photo.type },
              body: photo,
              credentials: "include",
            });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              await apiRequest("POST", `/api/orders/${order.id}/photos`, {
                fileKey: uploadData.fileKey,
                photoType: "before",
              });
            }
          } catch (e) {
            console.error("Photo upload failed:", e);
          }
        }
      }
      return order;
    },
    onSuccess: () => {
      toast({ title: "Order Submitted!", description: "Your booking has been submitted for review." });
      navigate("/customer");
    },
    onError: (err: Error) => {
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to submit your order. Your estimate has been saved.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateItem = (index: number, field: keyof CarpetItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const canProceed = () => {
    if (step === 0) {
      return items.every(
        (item) =>
          item.carpetType &&
          item.width.trim() !== "" && parseFloat(item.width) > 0 &&
          item.length.trim() !== "" && parseFloat(item.length) > 0
      );
    }
    if (step === 1) return true;
    if (step === 2) {
      if (needsLocation) {
        return address.trim().length > 0 && selectedZone !== "";
      }
      return true;
    }
    return true;
  };

  const stepLabels = ["Carpet Details", "Photos", "Pickup & Return", "Review"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3 h-16">
          <Button variant="ghost" size="icon" onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/logo-clear.png" alt="Sparkle n' Glee" className="h-9 w-auto drop-shadow-sm" />
            <span className="font-sans text-lg font-bold">Book Cleaning</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1">
        <div className="flex items-center gap-1 mb-8">
          {stepLabels.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${i}`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-sans font-bold mb-1" data-testid="text-step-title">Carpet Details</h2>
                  <p className="text-sm text-muted-foreground">Add the carpets you'd like us to clean. Pricing updates as you fill in details.</p>
                </div>
                {items.map((item, index) => {
                  const est = getItemEstimate(item, pricing);
                  const rule = pricing.find((p) => p.carpetType === item.carpetType);
                  return (
                    <Card key={index} className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h3 className="font-semibold text-sm">Carpet {index + 1}</h3>
                        {items.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} data-testid={`button-remove-item-${index}`}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4">
                        <div>
                          <Label className="text-xs">Carpet Type</Label>
                          <Select value={item.carpetType} onValueChange={(v) => updateItem(index, "carpetType", v)}>
                            <SelectTrigger data-testid={`select-carpet-type-${index}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARPET_TYPES.map((t) => {
                                const pr = pricing.find((p) => p.carpetType === t);
                                return (
                                  <SelectItem key={t} value={t}>
                                    {t} {pr ? `— KES ${parseFloat(pr.pricePerSqMeter).toLocaleString()}/m²` : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {rule && (
                            <p className="text-xs text-primary mt-1 font-medium" data-testid={`text-rate-${index}`}>
                              Rate: KES {parseFloat(rule.pricePerSqMeter).toLocaleString()} per m²
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Width (m)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              placeholder="2.0"
                              value={item.width}
                              onChange={(e) => updateItem(index, "width", e.target.value)}
                              data-testid={`input-width-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Length (m)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              placeholder="3.0"
                              value={item.length}
                              onChange={(e) => updateItem(index, "length", e.target.value)}
                              data-testid={`input-length-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              data-testid={`input-qty-${index}`}
                            />
                          </div>
                        </div>

                        {est.subtotal > 0 && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between" data-testid={`estimate-card-${index}`}>
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {est.area.toFixed(1)} m² x KES {est.pricePerSqM.toLocaleString()} x {est.qty}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold text-primary" data-testid={`text-item-price-${index}`}>
                              KES {est.subtotal.toLocaleString()}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs">Notes (optional)</Label>
                          <Textarea
                            placeholder="Any special instructions or stains to note..."
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            className="resize-none"
                            rows={2}
                            data-testid={`input-notes-${index}`}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <Button variant="outline" className="w-full" onClick={addItem} data-testid="button-add-carpet">
                  <Plus className="w-4 h-4 mr-2" /> Add Another Carpet
                </Button>

                {itemsTotal > 0 && (
                  <Card className="p-4 bg-slate-800 text-white" data-testid="card-running-total">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Estimated Cleaning Cost</p>
                        <p className="text-xs text-slate-300">{items.length} carpet{items.length > 1 ? "s" : ""} &middot; Fees added next</p>
                      </div>
                      <p className="text-xl font-bold text-primary" data-testid="text-running-total">
                        KES {itemsTotal.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-sans font-bold mb-1" data-testid="text-step-title">Upload Photos</h2>
                  <p className="text-sm text-muted-foreground">Take photos of your carpets for a more accurate estimate. (Optional)</p>
                </div>
                <Card className="p-6">
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-muted hover:border-primary/40"
                    data-testid="label-photo-upload"
                  >
                    <Camera className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">Tap to upload photos</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB each</p>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      data-testid="input-photo-upload"
                    />
                  </label>
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-md overflow-visible bg-muted">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                            data-testid={`button-remove-photo-${i}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-sans font-bold mb-1" data-testid="text-step-title">Pickup & Return</h2>
                  <p className="text-sm text-muted-foreground">Choose how you'd like us to handle your carpet pickup and return.</p>
                </div>

                <Card className="p-5 space-y-2">
                  <Label className="text-sm font-semibold">How should we get your carpet?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPickupOption("customer_delivers")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        pickupOption === "customer_delivers"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/30"
                      }`}
                      data-testid="option-bring-it"
                    >
                      <Building2 className={`w-8 h-8 ${pickupOption === "customer_delivers" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-center">I'll bring it</span>
                      <span className="text-[10px] text-muted-foreground text-center">Drop off at our premises</span>
                      <Badge variant="secondary" className="text-[10px]">Free</Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupOption("request_pickup")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        pickupOption === "request_pickup"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/30"
                      }`}
                      data-testid="option-pickup"
                    >
                      <Truck className={`w-8 h-8 ${pickupOption === "request_pickup" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-center">Pick up from me</span>
                      <span className="text-[10px] text-muted-foreground text-center">We come to your location</span>
                      <Badge variant="outline" className="text-[10px]">Fee applies</Badge>
                    </button>
                  </div>
                </Card>

                <Card className="p-5 space-y-2">
                  <Label className="text-sm font-semibold">How should we return your carpet?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReturnOption("customer_collects")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        returnOption === "customer_collects"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/30"
                      }`}
                      data-testid="option-collect-it"
                    >
                      <Building2 className={`w-8 h-8 ${returnOption === "customer_collects" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-center">I'll collect it</span>
                      <span className="text-[10px] text-muted-foreground text-center">Pick up from our premises</span>
                      <Badge variant="secondary" className="text-[10px]">Free</Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnOption("request_delivery")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        returnOption === "request_delivery"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/30"
                      }`}
                      data-testid="option-delivery"
                    >
                      <Truck className={`w-8 h-8 ${returnOption === "request_delivery" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-center">Deliver to me</span>
                      <span className="text-[10px] text-muted-foreground text-center">We deliver to your location</span>
                      <Badge variant="outline" className="text-[10px]">Fee applies</Badge>
                    </button>
                  </div>
                </Card>

                {needsLocation && (
                  <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-semibold">
                        {pickupOption === "request_pickup" && returnOption === "request_delivery"
                          ? "Pickup & Delivery Location"
                          : pickupOption === "request_pickup"
                          ? "Pickup Location"
                          : "Delivery Location"}
                      </Label>
                    </div>
                    <div>
                      <Label className="text-xs">Area / Zone</Label>
                      <Select value={selectedZone} onValueChange={setSelectedZone}>
                        <SelectTrigger data-testid="select-delivery-zone">
                          <SelectValue placeholder="Select your area" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.id} value={z.id}>
                              {z.name} — KES {parseFloat(z.fee).toLocaleString()}/trip
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {zone && (
                        <div className="mt-2 space-y-1">
                          {pickupOption === "request_pickup" && (
                            <p className="text-xs text-muted-foreground">Pickup fee: <span className="font-medium text-foreground">KES {zoneFee.toLocaleString()}</span></p>
                          )}
                          {returnOption === "request_delivery" && (
                            <p className="text-xs text-muted-foreground">Delivery fee: <span className="font-medium text-foreground">KES {zoneFee.toLocaleString()}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Location Name</Label>
                      <Input
                        placeholder="e.g., Westlands, Kilimani"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        data-testid="input-location-name"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Address</Label>
                      <Textarea
                        placeholder="Building name, floor, apartment..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="resize-none"
                        rows={3}
                        data-testid="input-address"
                      />
                    </div>
                  </Card>
                )}

                <Card className="p-5 space-y-4">
                  <div>
                    <Label className="text-xs">Special Notes</Label>
                    <Textarea
                      placeholder="Any special instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="resize-none"
                      rows={2}
                      data-testid="input-order-notes"
                    />
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-sans font-bold mb-1" data-testid="text-step-title">Order Summary</h2>
                  <p className="text-sm text-muted-foreground">Review your order before submitting.</p>
                </div>
                <Card className="p-5 space-y-3">
                  <h3 className="font-semibold text-sm">Carpet Items</h3>
                  {items.map((item, i) => {
                    const est = getItemEstimate(item, pricing);
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{item.carpetType || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {est.area.toFixed(1)} m² x KES {est.pricePerSqM.toLocaleString()} x {est.qty}
                          </p>
                        </div>
                        <p className="text-sm font-semibold" data-testid={`text-subtotal-${i}`}>KES {est.subtotal.toLocaleString()}</p>
                      </div>
                    );
                  })}

                  <div className="border-t pt-3">
                    <h3 className="font-semibold text-sm mb-2">Pickup & Return</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        {pickupOption === "request_pickup" ? (
                          <><Truck className="w-3.5 h-3.5 text-primary" /><span>We pick up</span></>
                        ) : (
                          <><Building2 className="w-3.5 h-3.5 text-muted-foreground" /><span>I'll bring it</span></>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {returnOption === "request_delivery" ? (
                          <><Truck className="w-3.5 h-3.5 text-primary" /><span>We deliver</span></>
                        ) : (
                          <><Building2 className="w-3.5 h-3.5 text-muted-foreground" /><span>I'll collect</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-xs font-medium">Have a coupon?</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(""); }}
                        placeholder="Enter coupon code"
                        disabled={!!appliedPromo}
                        className="flex-1"
                        data-testid="input-coupon-code"
                      />
                      {appliedPromo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAppliedPromo(null); setCouponCode(""); }}
                          data-testid="button-remove-coupon"
                        >
                          <X className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => validateCoupon.mutate()}
                          disabled={!couponCode.trim() || validateCoupon.isPending}
                          data-testid="button-apply-coupon"
                        >
                          {validateCoupon.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                        </Button>
                      )}
                    </div>
                    {couponError && <p className="text-xs text-destructive mt-1" data-testid="text-coupon-error">{couponError}</p>}
                    {appliedPromo && (
                      <div className="flex items-center gap-2 mt-2 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">{appliedPromo.name} applied!</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cleaning</span>
                      <span>KES {itemsTotal.toLocaleString()}</span>
                    </div>
                    {pickupFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pickup ({zone?.name})</span>
                        <span>KES {pickupFee.toLocaleString()}</span>
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery ({zone?.name})</span>
                        <span>KES {deliveryFee.toLocaleString()}</span>
                      </div>
                    )}
                    {appliedPromo && getDiscount() > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedPromo.name})</span>
                        <span>-KES {getDiscount().toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="font-bold">Estimated Total</p>
                      <p className="font-bold text-xl text-primary" data-testid="text-total">
                        KES {grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                {needsLocation && address && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {pickupOption === "request_pickup" && returnOption === "request_delivery"
                        ? "Pickup & Delivery Location"
                        : pickupOption === "request_pickup"
                        ? "Pickup Location"
                        : "Delivery Location"}
                    </h3>
                    <p className="text-sm">{locationName}</p>
                    <p className="text-sm text-muted-foreground">{address}</p>
                  </Card>
                )}

                {photos.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-sm mb-3">Photos ({photos.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {photos.map((p, i) => (
                        <img key={i} src={URL.createObjectURL(p)} alt="" className="w-16 h-16 rounded-md object-cover" />
                      ))}
                    </div>
                  </Card>
                )}

                {!user && (
                  <Card className="p-4 border-primary/30 bg-primary/5" data-testid="card-login-notice">
                    <p className="text-sm font-medium">You'll need to sign in to submit this order.</p>
                    <p className="text-xs text-muted-foreground mt-1">Don't worry — your estimate details will be ready for you after login.</p>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t mt-6 -mx-4 px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} data-testid="button-prev-step">
                  Back
                </Button>
              )}
            </div>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} data-testid="button-next-step">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Sign In Required",
                      description: "Please sign in to submit your booking.",
                    });
                    navigate("/login");
                    return;
                  }
                  createOrder.mutate();
                }}
                disabled={createOrder.isPending}
                data-testid="button-submit-order"
              >
                {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {user ? "Submit Order" : "Sign In to Submit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
