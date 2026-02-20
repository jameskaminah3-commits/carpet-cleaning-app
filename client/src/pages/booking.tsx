import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, ArrowRight, Plus, X, MapPin, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CARPET_TYPES } from "@shared/schema";
import type { PricingRule, DeliveryZone } from "@shared/schema";

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

export default function BookingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<CarpetItem[]>([{ ...emptyItem }]);
  const [selectedZone, setSelectedZone] = useState("");
  const [address, setAddress] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const { data: pricing = [] } = useQuery<PricingRule[]>({
    queryKey: ["/api/pricing"],
  });

  const { data: zones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      const orderItems = items.map((item) => {
        const w = parseFloat(item.width) || 0;
        const l = parseFloat(item.length) || 0;
        const qty = parseInt(item.quantity) || 1;
        const rule = pricing.find((p) => p.carpetType === item.carpetType);
        const pricePerSqM = rule ? parseFloat(rule.pricePerSqMeter) : 500;
        const area = w * l;
        const subtotal = area * pricePerSqM * qty;
        return {
          carpetType: item.carpetType,
          width: w,
          length: l,
          quantity: qty,
          unitPrice: pricePerSqM,
          subtotal,
          description: item.description || undefined,
        };
      });

      const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
      const zone = zones.find((z) => z.id === selectedZone);
      const deliveryFee = zone ? parseFloat(zone.fee) : 0;
      const grandTotal = totalAmount + deliveryFee;

      const res = await apiRequest("POST", "/api/orders", {
        items: orderItems,
        deliveryZoneId: selectedZone || undefined,
        pickupAddress: address,
        locationName,
        notes,
        totalAmount: grandTotal,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order Created!", description: "Your booking has been submitted successfully." });
      navigate("/customer");
    },
    onError: (err: Error) => {
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

  const getEstimate = () => {
    let total = 0;
    items.forEach((item) => {
      const w = parseFloat(item.width) || 0;
      const l = parseFloat(item.length) || 0;
      const qty = parseInt(item.quantity) || 1;
      const rule = pricing.find((p) => p.carpetType === item.carpetType);
      const pricePerSqM = rule ? parseFloat(rule.pricePerSqMeter) : 500;
      total += w * l * pricePerSqM * qty;
    });
    const zone = zones.find((z) => z.id === selectedZone);
    if (zone) total += parseFloat(zone.fee);
    return total;
  };

  const canProceed = () => {
    if (step === 0) {
      return items.every((item) => item.carpetType && parseFloat(item.width) > 0 && parseFloat(item.length) > 0);
    }
    if (step === 1) return true;
    if (step === 2) return address.length > 0;
    return true;
  };

  const steps = ["Carpet Details", "Photos", "Delivery", "Review"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3 h-16">
          <Button variant="ghost" size="icon" onClick={() => step > 0 ? setStep(step - 1) : navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif text-lg font-bold">Book Cleaning</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
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
              {i < steps.length - 1 && (
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
                  <h2 className="text-xl font-serif font-bold mb-1" data-testid="text-step-title">Carpet Details</h2>
                  <p className="text-sm text-muted-foreground">Add the carpets you'd like us to clean.</p>
                </div>
                {items.map((item, index) => (
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
                            {CARPET_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Width (m)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
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
                            min="0"
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
                ))}
                <Button variant="outline" className="w-full" onClick={addItem} data-testid="button-add-carpet">
                  <Plus className="w-4 h-4 mr-2" /> Add Another Carpet
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-serif font-bold mb-1" data-testid="text-step-title">Upload Photos</h2>
                  <p className="text-sm text-muted-foreground">Take photos of your carpets for a more accurate estimate. (Optional)</p>
                </div>
                <Card className="p-6">
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-muted"
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
                  <h2 className="text-xl font-serif font-bold mb-1" data-testid="text-step-title">Pickup Location</h2>
                  <p className="text-sm text-muted-foreground">Where should we pick up your carpets?</p>
                </div>
                <Card className="p-5 space-y-4">
                  <div>
                    <Label className="text-xs">Delivery Zone</Label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger data-testid="select-delivery-zone">
                        <SelectValue placeholder="Select your area" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} — KES {parseFloat(z.fee).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label className="text-xs">Pickup Address</Label>
                    <Textarea
                      placeholder="Building name, floor, apartment..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="resize-none"
                      rows={3}
                      data-testid="input-address"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Special Notes</Label>
                    <Textarea
                      placeholder="Any special instructions for pickup..."
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
                  <h2 className="text-xl font-serif font-bold mb-1" data-testid="text-step-title">Order Summary</h2>
                  <p className="text-sm text-muted-foreground">Review your order before submitting.</p>
                </div>
                <Card className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">Carpet Items</h3>
                  {items.map((item, i) => {
                    const w = parseFloat(item.width) || 0;
                    const l = parseFloat(item.length) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    const rule = pricing.find((p) => p.carpetType === item.carpetType);
                    const pricePerSqM = rule ? parseFloat(rule.pricePerSqMeter) : 500;
                    const area = w * l;
                    const subtotal = area * pricePerSqM * qty;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{item.carpetType || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{w}m x {l}m — Qty: {qty}</p>
                        </div>
                        <p className="text-sm font-semibold" data-testid={`text-subtotal-${i}`}>KES {subtotal.toLocaleString()}</p>
                      </div>
                    );
                  })}
                  {selectedZone && (
                    <div className="flex items-center justify-between gap-2 py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">Delivery Fee</p>
                        <p className="text-xs text-muted-foreground">{zones.find((z) => z.id === selectedZone)?.name}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        KES {parseFloat(zones.find((z) => z.id === selectedZone)?.fee || "0").toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <p className="font-bold">Estimated Total</p>
                    <p className="font-bold text-lg text-primary" data-testid="text-total">
                      KES {getEstimate().toLocaleString()}
                    </p>
                  </div>
                </Card>

                {address && (
                  <Card className="p-5">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Pickup Location
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
              <Button onClick={() => createOrder.mutate()} disabled={createOrder.isPending} data-testid="button-submit-order">
                {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
