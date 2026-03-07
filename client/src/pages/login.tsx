import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Sparkles, ArrowLeft, Phone, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function LoginPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const { data: existingUser } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (existingUser) {
    const target = existingUser.role === "admin" ? "/admin" : existingUser.role === "technician" ? "/technician" : "/customer";
    if (location !== target) {
      window.history.replaceState(null, "", target);
      navigate(target, { replace: true });
    }
  }

  const requestOtp = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/request-otp", { phone });
      return res.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      if (data.otp) {
        toast({ title: "Demo OTP", description: `Your OTP is: ${data.otp}` });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { phone, otp });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const target = data.user?.role === "admin" ? "/admin" : data.user?.role === "technician" ? "/technician" : "/customer";
      navigate(target, { replace: true });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo-clear.png" alt="Sparkle n' Glee" className="h-10 w-auto drop-shadow-sm" />
            <span className="text-lg font-bold text-primary">Sparkle n' Glee</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <Card className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-sans font-bold" data-testid="text-login-title">
                {step === "phone" ? "Welcome Back" : "Verify OTP"}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {step === "phone"
                  ? "Enter your phone number to continue"
                  : `We sent a code to ${phone}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0712 345 678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        data-testid="input-phone"
                      />
                      <p className="text-xs text-muted-foreground">Kenyan phone number (e.g., 0712345678)</p>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!phone || requestOtp.isPending}
                      onClick={() => requestOtp.mutate()}
                      data-testid="button-request-otp"
                    >
                      {requestOtp.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Continue
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="input-otp">
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button
                      className="w-full"
                      disabled={otp.length !== 6 || verifyOtp.isPending}
                      onClick={() => verifyOtp.mutate()}
                      data-testid="button-verify-otp"
                    >
                      {verifyOtp.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Verify & Sign In
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => { setStep("phone"); setOtp(""); }}
                      data-testid="button-change-phone"
                    >
                      Change phone number
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
