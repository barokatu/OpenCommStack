"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import toast from "react-hot-toast";
import { MessageCircle, Phone, Shield, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { user, token } = await api.register({ phone, pin, name });
        setAuth(user, token);
        toast.success("Berhasil mendaftar!");
      } else {
        const { user, token } = await api.login({ phone, pin });
        setAuth(user, token);
        toast.success("Selamat datang kembali!");
      }
      router.push("/chats");
    } catch (err: any) {
      toast.error(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wa-primary via-wa-secondary to-wa-accent flex flex-col">
      {/* Header decoration */}
      <div className="h-56 bg-wa-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-wa-primary/80 to-wa-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              OpenCommStack
            </h1>
            <p className="text-white/60 text-sm mt-1">Pesan Instan Lokal</p>
          </motion.div>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 -mt-8 relative z-10">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-4 max-w-md md:mx-auto"
        >
          <div className="bg-white dark:bg-wa-darkSurface rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-wa-separatorDark">
              <button
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                  !isRegister
                    ? "text-wa-primary"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500"
                }`}
              >
                {t.login}
                {!isRegister && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                  isRegister
                    ? "text-wa-primary"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500"
                }`}
              >
                {t.register}
                {isRegister && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-wa-primary"
                  />
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="name"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                      {t.name}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.enterName}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-wa-darkInput rounded-xl border-0 focus:ring-2 focus:ring-wa-primary/50 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                      required={isRegister}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.enterPhone}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-wa-darkInput rounded-xl border-0 focus:ring-2 focus:ring-wa-primary/50 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t.pin}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder={t.enterPin}
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-wa-darkInput rounded-xl border-0 focus:ring-2 focus:ring-wa-primary/50 text-gray-900 dark:text-white placeholder-gray-400 tracking-[0.5em] text-center transition-all"
                    required
                  />
                </div>
                <div className="flex justify-center mt-2 gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        i < pin.length
                          ? "bg-wa-accent scale-110"
                          : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-wa-primary to-wa-secondary text-white rounded-xl font-semibold shadow-lg shadow-wa-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-wa-primary/40"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : isRegister ? (
                  t.register
                ) : (
                  t.login
                )}
              </motion.button>
            </form>

            {/* Security note */}
            <div className="px-6 pb-5">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 justify-center">
                <Shield className="w-3.5 h-3.5" />
                <span>Enkripsi end-to-end • 100% Lokal</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
