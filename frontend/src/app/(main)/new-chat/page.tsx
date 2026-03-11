"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import { Avatar } from "@/components/common/Avatar";
import toast from "react-hot-toast";

export default function NewChatPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(token!),
    enabled: !!token,
  });

  const { data: searchData } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: () => api.searchUsers(token!, searchQuery),
    enabled: !!token && searchQuery.length > 0,
  });

  const users = searchQuery ? searchData?.users || [] : usersData?.users || [];

  const handleStartChat = async (otherUserId: string) => {
    try {
      const { chat } = await api.createDirectChat(token!, otherUserId);
      router.push(`/chats/${chat.id}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat obrolan");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error("Nama grup dan anggota wajib diisi");
      return;
    }
    try {
      const { chat } = await api.createGroup(token!, {
        name: groupName,
        memberIds: selectedMembers.map((m) => m.id),
      });
      router.push(`/chats/${chat.id}`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat grup");
    }
  };

  const toggleMember = (member: any) => {
    if (selectedMembers.find((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-wa-primary dark:bg-wa-headerDark px-2 pt-12 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {showGroupCreator ? t.newGroup : t.newChat}
          </h1>
        </div>

        <div className="relative mx-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-wa-darkInput rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-dark">
        {/* New group button */}
        {!showGroupCreator && (
          <button
            onClick={() => setShowGroupCreator(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-darkSurface transition-colors border-b border-gray-100 dark:border-wa-separatorDark"
          >
            <div className="w-12 h-12 bg-wa-accent rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">
              {t.newGroup}
            </p>
          </button>
        )}

        {/* Group creator */}
        {showGroupCreator && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-wa-separatorDark">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t.groupName}
              className="w-full py-2 border-b-2 border-wa-primary bg-transparent text-gray-900 dark:text-white focus:outline-none"
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1 bg-wa-primary/10 dark:bg-wa-accent/10 rounded-full pl-1 pr-2 py-0.5"
                  >
                    <Avatar src={m.avatar} name={m.name} size="sm" />
                    <span className="text-xs text-wa-primary dark:text-wa-accent">
                      {m.name}
                    </span>
                    <button onClick={() => toggleMember(m)}>
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="w-full mt-3 py-2.5 bg-wa-accent text-white rounded-xl font-medium disabled:opacity-50 transition-all"
            >
              {t.createGroup} ({selectedMembers.length})
            </motion.button>
          </div>
        )}

        {/* User list */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t.contacts}
          </p>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-wa-separatorDark">
          {users.map((u: any, index: number) => (
            <motion.button
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() =>
                showGroupCreator ? toggleMember(u) : handleStartChat(u.id)
              }
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-darkSurface transition-colors text-left"
            >
              {showGroupCreator && (
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedMembers.find((m) => m.id === u.id)
                      ? "bg-wa-accent border-wa-accent"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {selectedMembers.find((m) => m.id === u.id) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              )}

              <Avatar
                src={u.avatar}
                name={u.name}
                size="lg"
                online={u.isOnline}
              />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-[15px]">
                  {u.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {u.about}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>Tidak ada pengguna ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
