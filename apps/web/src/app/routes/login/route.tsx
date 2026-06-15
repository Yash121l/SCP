import { Navigate } from "react-router-dom";
import { LoginPage } from "../../../features/auth/login-page.js";
import { useAuth } from "../../../features/auth/auth-context.js";

export function LoginRoute() {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/workspace/dashboard" replace />;
  }

  return <LoginPage />;
}

