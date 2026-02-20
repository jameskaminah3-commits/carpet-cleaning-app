import { useQuery } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [, navigate] = useLocation();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "technician") return <Redirect to="/technician" />;
    return <Redirect to="/customer" />;
  }

  return children;
}
