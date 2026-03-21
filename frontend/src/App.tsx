import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppRouter } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import * as authService from "@/services/authService";

const queryClient = new QueryClient();

function AuthBootstrap() {
  useEffect(() => {
    const run = async () => {
      await useAuthStore.persist.rehydrate();
      const token = useAuthStore.getState().token;
      if (!token) {
        return;
      }
      try {
        const user = await authService.getMe();
        useAuthStore.getState().setUser(user);
      } catch {
        useAuthStore.getState().logout();
      }
    };
    void run();
  }, []);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <AppRouter />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
