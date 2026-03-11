"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, X, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import { cn, formatTime } from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";
import { STATUS_COLORS } from "@/lib/constants";
import toast from "react-hot-toast";

export default function StatusPage() {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreator, setShowCreator] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [viewingStatus, setViewingStatus] = useState<any>(null);
  const [viewIndex, setViewIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => api.getStatuses(token!),
    enabled: !!token,
    refetchInterval: 10000,
  });

  const myStatuses = data?.myStatuses;
  const otherStatuses = data?.otherStatuses || [];

  const handleCreateStatus = async () => {
    if (!statusText.trim()) return;
    try {
      await api.createStatus(token!, {
        content: statusText,
        type: "text",
        bgColor: selectedColor,
      });
      setStatusText("");
      setShowCreator(false);
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      toast.success("Status berhasil dibuat!");
    } catch (err) {
      toast.error("Gagal membuat status");
    }
  };

  const handleViewStatus = async (userStatuses: any) => {
    setViewingStatus(userStatuses);
    setViewIndex(0);
    // Mark as viewed
    for (const s of userStatuses.statuses) {
      await api.viewStatus(token!, s.id).catch(() => {});
    }
  };

  const handleNextStatus = () => {
    if (!viewingStatus) return;
    if (viewIndex < viewingStatus.statuses.length - 1) {
      setViewIndex(viewIndex + 1);
    } else {
      setViewingStatus(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-wa-primary dark:bg-wa-headerDark px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold text-white">{t.status}</h1>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-dark">
        {/* My Status */}
        <div className="p-4">
          <button
            onClick={() =>
              myStatuses ? handleViewStatus(myStatuses) : setShowCreator(true)
            }
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name || ""} size="lg" />
              {!myStatuses && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-wa-accent rounded-full flex items-center justify-center border-2 border-white dark:border-wa-dark">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t.myStatus}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {myStatuses
                  ? `${myStatuses.statuses.length} pembaruan • ${formatTime(myStatuses.statuses[0].createdAt)}`
                  : t.addStatus}
              </p>
            </div>
          </button>
        </div>

        <div className="border-t border-gray-100 dark:border-wa-separatorDark" />

        {/* Other statuses */}
        {otherStatuses.length > 0 ? (
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.recentUpdates}
            </p>
            <div className="space-y-1">
              {otherStatuses.map((userStatus: any) => (
                <motion.button
                  key={userStatus.user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleViewStatus(userStatus)}
                  className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-wa-darkSurface transition-colors text-left"
                >
                  <div
                    className={cn(
                      "rounded-full p-0.5",
                      userStatus.hasUnviewed
                        ? "ring-2 ring-wa-accent ring-offset-2 ring-offset-white dark:ring-offset-wa-dark"
                        : "ring-2 ring-gray-200 dark:ring-gray-600 ring-offset-2 ring-offset-white dark:ring-offset-wa-dark",
                    )}
                  >
                    <Avatar
                      src={userStatus.user.avatar}
                      name={userStatus.user.name}
                      size="md"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {userStatus.user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(userStatus.statuses[0].createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500">{t.noStatus}</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCreator(true)}
        className="fixed bottom-20 right-5 w-14 h-14 bg-wa-accent rounded-full shadow-lg shadow-wa-accent/30 flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Status Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: selectedColor }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <button onClick={() => setShowCreator(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={!statusText.trim()}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Kirim
                </button>
              </div>

              <div className="px-6 py-12">
                <textarea
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder={t.statusPlaceholder}
                  className="w-full bg-transparent text-white text-2xl font-medium text-center placeholder-white/50 resize-none focus:outline-none"
                  rows={3}
                  autoFocus
                />
              </div>

              <div className="px-4 py-3 flex justify-center gap-2">
                {STATUS_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      selectedColor === color
                        ? "ring-2 ring-white ring-offset-2 scale-110"
                        : "",
                    )}
                    style={{
                      backgroundColor: color,
                      ringOffsetColor: selectedColor,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Viewer */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleNextStatus}
            className="fixed inset-0 z-50 flex flex-col bg-black"
          >
            {/* Progress bars */}
            <div className="flex gap-1 px-2 pt-2 z-10">
              {viewingStatus.statuses.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    className={cn(
                      "h-full bg-white rounded-full transition-all duration-500",
                      idx < viewIndex
                        ? "w-full"
                        : idx === viewIndex
                          ? "w-full"
                          : "w-0",
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 z-10">
              <Avatar
                src={viewingStatus.user.avatar}
                name={viewingStatus.user.name}
                size="md"
              />
              <div>
                <p className="text-white font-semibold text-sm">
                  {viewingStatus.user.name}
                </p>
                <p className="text-white/60 text-xs">
                  {formatTime(viewingStatus.statuses[viewIndex].createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingStatus(null);
                }}
                className="ml-auto"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 flex items-center justify-center px-8"
              style={{
                backgroundColor:
                  viewingStatus.statuses[viewIndex].bgColor || "#075E54",
              }}
            >
              {viewingStatus.statuses[viewIndex].mediaUrl ? (
                <img
                  src={viewingStatus.statuses[viewIndex].mediaUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-white text-2xl font-medium text-center">
                  {viewingStatus.statuses[viewIndex].content}
                </p>
              )}
            </div>

            {/* Viewers */}
            {viewingStatus.user.id === user?.id && (
              <div className="px-4 py-3 bg-black/50">
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Eye className="w-4 h-4" />
                  <span>
                    {viewingStatus.statuses[viewIndex].views?.length || 0}{" "}
                    {t.viewedBy.toLowerCase()}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
