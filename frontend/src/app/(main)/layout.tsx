"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { TabBar } from "@/components/layout/TabBar";
import { CallProvider } from "@/components/call/CallProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  useSocket(); // Initialize socket connection

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <CallProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-wa-dark">
        <main className="flex-1 overflow-hidden">{children}</main>
        <TabBar />
      </div>
    </CallProvider>
  );
}
