"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCall } from "@/components/call/CallProvider";
import { getSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import { cn, formatTime, formatChatDate } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";

export default function CallsPage() {
  const { token, user } = useAuthStore();
  const { initiateCall } = useCall();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: () => api.getCalls(token!),
    enabled: !!token,
    refetchInterval: 10000,
  });

  // Refetch call history when a call ends
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCallEnded = () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    };

    socket.on("call:ended", handleCallEnded);
    socket.on("call:rejected", handleCallEnded);

    return () => {
      socket.off("call:ended", handleCallEnded);
      socket.off("call:rejected", handleCallEnded);
    };
  }, [queryClient]);

  const calls = data?.calls || [];

  // Group calls by date
  const groupCallsByDate = (callList: any[]) => {
    const groups: { date: string; calls: any[] }[] = [];
    let currentDate = "";
    for (const call of callList) {
      const date = formatChatDate(call.createdAt);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, calls: [call] });
      } else {
        groups[groups.length - 1].calls.push(call);
      }
    }
    return groups;
  };

  const dateGroups = groupCallsByDate(calls);

  const getCallIcon = (call: any) => {
    if (call.status === "missed" || call.status === "rejected") {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    if (call.isInitiator) {
      return <PhoneOutgoing className="w-4 h-4 text-wa-accent" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-wa-accent" />;
  };

  const getCallStatusText = (call: any) => {
    if (call.status === "missed") return "Tidak Terjawab";
    if (call.status === "rejected") return "Ditolak";
    if (call.status === "active") return "Sedang Berlangsung";
    if (call.status === "completed" && call.duration > 0) {
      const m = Math.floor(call.duration / 60);
      const s = call.duration % 60;
      return m > 0 ? `${m} mnt ${s} dtk` : `${s} dtk`;
    }
    return call.isInitiator ? "Panggilan Keluar" : "Panggilan Masuk";
  };

  const handleRecall = (call: any) => {
    if (call.otherUser) {
      initiateCall(
        [call.otherUser.id],
        call.type,
        call.otherUser.name,
        call.otherUser.avatar,
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-wa-primary dark:bg-wa-headerDark px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold text-white">{t.calls}</h1>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-dark">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-wa-darkSurface flex items-center justify-center mb-4">
              <Phone className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t.noCalls}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Gunakan tombol panggilan di halaman obrolan untuk memulai
              panggilan suara atau video
            </p>
          </div>
        ) : (
          <div>
            {dateGroups.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="px-4 pt-4 pb-1">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {group.date}
                  </p>
                </div>

                {/* Calls in this group */}
                {group.calls.map((call: any, index: number) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-darkSurface transition-colors"
                  >
                    <Avatar
                      src={call.otherUser?.avatar}
                      name={call.otherUser?.name || "?"}
                      size="lg"
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-[15px] truncate",
                          call.status === "missed" || call.status === "rejected"
                            ? "text-red-500"
                            : "text-gray-900 dark:text-white",
                        )}
                      >
                        {call.otherUser?.name || "Pengguna"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getCallIcon(call)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(call.createdAt)} •{" "}
                          {getCallStatusText(call)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRecall(call)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-wa-darkInput transition-colors"
                    >
                      {call.type === "video" ? (
                        <Video className="w-5 h-5 text-wa-primary dark:text-wa-accent" />
                      ) : (
                        <Phone className="w-5 h-5 text-wa-primary dark:text-wa-accent" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
