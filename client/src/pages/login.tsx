import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, User } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

export default function LoginPage() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const { data: existingUser } = useQuery<UserType | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // redirect if already logged in
  if (existingUser) {
    const target =
      existingUser.role === "admin"
        ? "/admin"
        : existingUser.role === "technician"
        ? "/technician"
        : "/customer";

    if (location !== target) {
      window.history.replaceState(null, "", target);
      navigate(target, { replace: true });
    }
  }

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        identifier,
        password,
      });
      return res.json();
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

const target =
  redirect ||
  (data.user?.role === "admin"
    ? "/admin"
    : data.user?.role === "technician"
    ? "/technician"
    : "/customer");

navigate(target, { replace: true });
    },

    onError: (err: Error) => {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
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
                <User className="w-5 h-5 text-primary" />
              </div>

              <h1 className="text-2xl font-sans font-bold">
                Welcome Back
              </h1>

              <p className="text-sm text-muted-foreground mt-2">
                Login using your email or phone number
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email or Phone</Label>
                <Input
                  placeholder="email@example.com or 0712345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  data-testid="input-identifier"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>

              <Button
                className="w-full"
                disabled={!identifier || !password || loginMutation.isPending}
                onClick={() => loginMutation.mutate()}
                data-testid="button-login"
              >
                {loginMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                Sign In
              </Button>

<Button
  variant="ghost"
  className="w-full text-primary underline"
  onClick={() => navigate("/forgot-password")}
>
  Forgot password?
</Button>

<Button
  variant="ghost"
  className="w-full"
  onClick={() => navigate("/register")}
>
  Create an account
</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
