import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", {
        email,
      });
      return res.json();
    },
    onSuccess: () => {
      setStep("reset");

      toast({
        title: "OTP Sent",
        description: "Check your email for the reset code.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        otp,
        password,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "You can now login with your new password.",
      });

      navigate("/login");
    },
    onError: (err: Error) => {
      toast({
        title: "Reset Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Card className="p-6 space-y-5">

          <div className="text-center">
            <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
            <h1 className="text-xl font-bold">Forgot Password</h1>
          </div>

          {step === "email" && (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={!email || requestOtpMutation.isPending}
                onClick={() => requestOtpMutation.mutate()}
              >
                {requestOtpMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Send Reset Code
              </Button>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={!otp || !password || resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate()}
              >
                {resetPasswordMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Reset Password
              </Button>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}