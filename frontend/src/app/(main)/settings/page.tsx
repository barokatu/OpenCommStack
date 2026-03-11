"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Moon,
  Sun,
  LogOut,
  User,
  Lock,
  Globe,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import { Avatar } from "@/components/common/Avatar";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, updateUser, logout } = useAuthStore();
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "");

  const handleToggleDarkMode = async () => {
    const newValue = !user?.darkMode;
    updateUser({ darkMode: newValue });
    try {
      await api.updateProfile(token!, { darkMode: newValue });
    } catch {}
  };

  const handleSaveName = async () => {
    try {
      await api.updateProfile(token!, { name });
      updateUser({ name });
      setEditingName(false);
      toast.success("Nama berhasil diubah");
    } catch {
      toast.error("Gagal mengubah nama");
    }
  };

  const handleSaveAbout = async () => {
    try {
      await api.updateProfile(token!, { about });
      updateUser({ about });
      setEditingAbout(false);
      toast.success("Tentang berhasil diubah");
    } catch {
      toast.error("Gagal mengubah tentang");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      <header className="bg-wa-primary dark:bg-wa-headerDark px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold text-white">{t.settings}</h1>
      </header>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-dark">
        {/* Profile section */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative">
            <Avatar src={user.avatar} name={user.name} size="xl" />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-wa-accent rounded-full flex items-center justify-center border-2 border-white dark:border-wa-dark">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Name */}
          <div className="mt-4 w-full max-w-sm">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 text-center text-lg font-semibold bg-gray-50 dark:bg-wa-darkInput rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-wa-primary/30"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-2 bg-wa-accent text-white rounded-lg text-sm font-medium"
                >
                  {t.save}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="w-full text-center text-lg font-semibold text-gray-900 dark:text-white hover:text-wa-primary transition-colors"
              >
                {user.name}
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user.phone}
          </p>
        </div>

        <div className="border-t border-gray-100 dark:border-wa-separatorDark" />

        {/* Settings items */}
        <div className="px-4 py-2">
          {/* About */}
          <button
            onClick={() => setEditingAbout(!editingAbout)}
            className="w-full flex items-center gap-4 px-3 py-4 hover:bg-gray-50 dark:hover:bg-wa-darkSurface rounded-xl transition-colors"
          >
            <User className="w-5 h-5 text-wa-grey" />
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.about}
              </p>
              <p className="text-gray-900 dark:text-white">{user.about}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {editingAbout && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="px-3 pb-3 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-wa-darkInput rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                  placeholder={t.about}
                />
                <button
                  onClick={handleSaveAbout}
                  className="px-3 py-2 bg-wa-accent text-white rounded-lg text-sm"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          )}

          <div className="border-t border-gray-50 dark:border-wa-separatorDark my-1" />

          {/* Dark mode */}
          <button
            onClick={handleToggleDarkMode}
            className="w-full flex items-center gap-4 px-3 py-4 hover:bg-gray-50 dark:hover:bg-wa-darkSurface rounded-xl transition-colors"
          >
            {user.darkMode ? (
              <Moon className="w-5 h-5 text-wa-grey" />
            ) : (
              <Sun className="w-5 h-5 text-wa-grey" />
            )}
            <div className="flex-1 text-left">
              <p className="text-gray-900 dark:text-white">{t.darkMode}</p>
            </div>
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${user.darkMode ? "bg-wa-accent" : "bg-gray-300"}`}
            >
              <motion.div
                layout
                className="w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: user.darkMode ? 20 : 0 }}
              />
            </div>
          </button>

          {/* Privacy */}
          <button className="w-full flex items-center gap-4 px-3 py-4 hover:bg-gray-50 dark:hover:bg-wa-darkSurface rounded-xl transition-colors">
            <Lock className="w-5 h-5 text-wa-grey" />
            <div className="flex-1 text-left">
              <p className="text-gray-900 dark:text-white">{t.privacy}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Terakhir dilihat, foto profil, tentang
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Language */}
          <button className="w-full flex items-center gap-4 px-3 py-4 hover:bg-gray-50 dark:hover:bg-wa-darkSurface rounded-xl transition-colors">
            <Globe className="w-5 h-5 text-wa-grey" />
            <div className="flex-1 text-left">
              <p className="text-gray-900 dark:text-white">Bahasa</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Indonesia
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <div className="border-t border-gray-50 dark:border-wa-separatorDark my-1" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-3 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <p className="text-red-500 font-medium">{t.logout}</p>
          </button>
        </div>

        {/* App info */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            OpenCommStack v1.0.0
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            100% Lokal • Enkripsi E2E
          </p>
        </div>
      </div>
    </div>
  );
}
