import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        name,
        email,
        phone,
        password,
      });

      return res.json();
    },

   onSuccess: async (data) => {
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  const target =
    redirect ||
    (data?.user?.role === "admin"
      ? "/admin"
      : data?.user?.role === "technician"
      ? "/technician"
      : "/customer");

  navigate(target, { replace: true });

  toast({
    title: "Account created",
    description: "Welcome to Sparkle n' Glee!",
  });
},

    onError: (err: Error) => {
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* HEADER */}

      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 h-16">

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <img
            
              src="/Logos.png"
              alt="Sparkle n' Glee"
              className="h-10 w-auto drop-shadow-sm"
            />

            <span className="text-lg font-bold text-primary">
              Sparkle n' Glee
            </span>
          </div>
        </div>
      </header>

      {/* BODY */}

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
                <UserPlus className="w-5 h-5 text-primary" />
              </div>

              <h1 className="text-2xl font-bold">
                Create Account
              </h1>

              <p className="text-sm text-muted-foreground mt-2">
                Register to confirm your booking
              </p>

            </div>

            {/* FORM */}

            <div className="space-y-4">

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={
                  !name || !email || !phone || !password || registerMutation.isPending
                }
                onClick={() => registerMutation.mutate()}
              >

                {registerMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}

                Create Account

              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Already have an account? Sign in
              </Button>

            </div>

          </Card>
        </motion.div>
      </div>
    </div>
  );
}