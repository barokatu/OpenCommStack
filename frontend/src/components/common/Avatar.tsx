"use client";

import { cn, getInitials } from "@/lib/utils";
import { API_URL } from "@/lib/constants";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({
  src,
  name,
  size = "md",
  online,
  className,
}: AvatarProps) {
  const initials = getInitials(name || "?");

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {src ? (
        <img
          src={src.startsWith("http") ? src : `${API_URL}${src}`}
          alt={name}
          className={cn(sizes[size], "rounded-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            sizes[size],
            "rounded-full bg-gradient-to-br from-wa-primary to-wa-secondary flex items-center justify-center text-white font-semibold",
          )}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-wa-darkSurface",
            size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3",
            online ? "bg-wa-accent" : "bg-gray-300",
          )}
        />
      )}
    </div>
  );
}
