import { AppRouter } from "./app/routes.js";
import { AuthProvider } from "./features/auth/auth-context.js";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

