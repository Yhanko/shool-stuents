import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type PrivateRouteProps = {
  children: React.ReactElement;
};

export function AuthenticatedRoute({ children }: PrivateRouteProps) {
  const token = useAuthStore((state) => state.token);
  const hasToken = !!token;

  return hasToken ? children : <Navigate to="/"/>;
}