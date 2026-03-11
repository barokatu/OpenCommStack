"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, CircleDot, Phone, Settings } from "lucide-react";
import { id as t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/chats", icon: MessageCircle, label: t.chats },
  { href: "/status", icon: CircleDot, label: t.status },
  { href: "/calls", icon: Phone, label: t.calls },
  { href: "/settings", icon: Settings, label: t.settings },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide tab bar in chat detail view
  if (pathname.includes("/chats/") && pathname.split("/").length > 2) {
    return null;
  }

  return (
    <nav className="border-t border-gray-100 dark:border-wa-separatorDark bg-white dark:bg-wa-darkSurface safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center py-2 px-4 rounded-xl transition-all relative min-w-[64px]",
                isActive
                  ? "text-wa-primary dark:text-wa-accent"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-wa-primary dark:bg-wa-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "scale-110",
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
