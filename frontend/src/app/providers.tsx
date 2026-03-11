"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: 2,
          },
        },
      }),
  );

  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [user?.darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#075E54",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
