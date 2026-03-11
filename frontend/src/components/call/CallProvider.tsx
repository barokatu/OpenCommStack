"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { getSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/common/Avatar";
import { cn } from "@/lib/utils";
import { id as t } from "@/lib/i18n";

interface CallContextType {
  initiateCall: (
    targetUserIds: string[],
    type: "voice" | "video",
    targetName?: string,
    targetAvatar?: string | null,
  ) => void;
  activeCall: any;
  incomingCall: any;
}

const CallContext = createContext<CallContextType>({
  initiateCall: () => {},
  activeCall: null,
  incomingCall: null,
});

export const useCall = () => useContext(CallContext);

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();

  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callState, setCallState] = useState<
    "idle" | "ringing" | "connecting" | "active"
  >("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // ── helpers ──

  const getPC = () => peerConnectionRef.current;

  const createPeerConnection = useCallback(
    (callId: string, targetUserId: string) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          // Use Google STUN for ICE gathering even on localhost (needed for candidate exchange)
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket();
          socket?.emit("webrtc:ice-candidate", {
            targetUserId,
            candidate: event.candidate,
            callId,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log("📹 Remote track received", event.streams);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("🔗 Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setCallState("active");
          // Start timer
          if (!timerRef.current) {
            timerRef.current = setInterval(
              () => setCallDuration((d) => d + 1),
              1000,
            );
          }
        }
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          cleanupCall();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE state:", pc.iceConnectionState);
      };

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      peerConnectionRef.current = pc;
      return pc;
    },
    [],
  );

  const getLocalStream = async (withVideo: boolean) => {
    try {
      // navigator.mediaDevices requires HTTPS (except on localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isSecure =
          typeof window !== "undefined" &&
          (window.location.protocol === "https:" ||
            window.location.hostname === "localhost");
        if (!isSecure) {
          alert(
            "Panggilan memerlukan HTTPS.\n\nUntuk menggunakan panggilan dari perangkat lain di jaringan lokal, buka Chrome dan ketik:\n\nchrome://flags/#unsafely-treat-insecure-origin-as-secure\n\nTambahkan: http://" +
              window.location.hostname +
              ":3000\n\nLalu restart Chrome.",
          );
        }
        console.error("❌ getUserMedia not available (requires HTTPS)");
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("❌ getUserMedia failed:", err);
      alert(
        "Tidak dapat mengakses mikrofon/kamera. Pastikan izin sudah diberikan.",
      );
      return null;
    }
  };

  const cleanupCall = useCallback(() => {
    console.log("🧹 Cleaning up call");
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = undefined;
    setActiveCall(null);
    setIncomingCall(null);
    setCallState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // ── Call actions ──

  const initiateCall = useCallback(
    async (
      targetUserIds: string[],
      type: "voice" | "video",
      targetName?: string,
      targetAvatar?: string | null,
    ) => {
      const socket = getSocket();
      if (!socket || activeCall || incomingCall) return;

      console.log("📞 Initiating call:", type, targetUserIds);

      // Get media first
      const stream = await getLocalStream(type === "video");
      if (!stream) return;

      setCallState("ringing");
      setActiveCall({
        type,
        targetUserIds,
        targetName: targetName || "Pengguna",
        targetAvatar,
        isInitiator: true,
      });

      socket.emit("call:initiate", {
        targetUserIds,
        type,
        isGroup: targetUserIds.length > 1,
      });

      // Listen for call:initiated to get the callId
      socket.once("call:initiated", (data: any) => {
        console.log("📞 Call initiated, id:", data.call.id);
        setActiveCall((prev: any) => ({ ...prev, callId: data.call.id }));
      });
    },
    [activeCall, incomingCall],
  );

  // ── Socket event handlers ──

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncoming = (data: any) => {
      console.log("📲 Incoming call from:", data.from.name);
      if (activeCall) return; // busy
      setIncomingCall(data);
      setCallState("ringing");
    };

    const handleAccepted = async (data: any) => {
      console.log("✅ Call accepted by:", data.userId);
      if (!activeCall?.isInitiator) return;

      const callId = activeCall.callId;
      const targetUserId = data.userId;

      setCallState("connecting");

      // Create peer connection and make offer
      const pc = createPeerConnection(callId, targetUserId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { targetUserId, offer, callId });
        console.log("📤 Offer sent");
      } catch (err) {
        console.error("❌ Create offer failed:", err);
      }
    };

    const handleRejected = (data: any) => {
      console.log("❌ Call rejected");
      cleanupCall();
    };

    const handleEnded = (data: any) => {
      console.log("📴 Call ended");
      cleanupCall();
    };

    const handleOffer = async (data: any) => {
      console.log("📥 Received offer from:", data.from);

      // Get media if not already
      if (!localStreamRef.current) {
        const callType =
          activeCall?.type || incomingCall?.call?.type || "voice";
        await getLocalStream(callType === "video");
      }

      const pc = createPeerConnection(data.callId, data.from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Apply any pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          targetUserId: data.from,
          answer,
          callId: data.callId,
        });
        console.log("📤 Answer sent");
      } catch (err) {
        console.error("❌ Handle offer failed:", err);
      }
    };

    const handleAnswer = async (data: any) => {
      console.log("📥 Received answer from:", data.from);
      const pc = getPC();
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

          // Apply pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(candidate);
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          console.error("❌ Handle answer failed:", err);
        }
      }
    };

    const handleIceCandidate = async (data: any) => {
      const pc = getPC();
      if (data.candidate) {
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("❌ Add ICE candidate failed:", err);
          }
        } else {
          // Queue it for later
          pendingCandidatesRef.current.push(
            new RTCIceCandidate(data.candidate),
          );
        }
      }
    };

    socket.on("call:incoming", handleIncoming);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
    };
  }, [activeCall, incomingCall, createPeerConnection, cleanupCall]);

  // ── User actions ──

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const socket = getSocket();
    if (!socket) return;

    console.log("✅ Accepting call");
    const callType = incomingCall.call.type;

    // Get media before accepting
    await getLocalStream(callType === "video");

    setActiveCall({
      type: callType,
      callId: incomingCall.call.id,
      targetName: incomingCall.from.name,
      targetAvatar: incomingCall.from.avatar,
      isInitiator: false,
    });
    setIncomingCall(null);
    setCallState("connecting");

    socket.emit("call:accept", { callId: incomingCall.call.id });
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    const socket = getSocket();
    socket?.emit("call:reject", { callId: incomingCall.call.id });
    setIncomingCall(null);
    setCallState("idle");
  };

  const handleEndCall = () => {
    const socket = getSocket();
    const callId = activeCall?.callId || incomingCall?.call?.id;
    if (callId) {
      socket?.emit("call:end", { callId, duration: callDuration });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const callType = activeCall?.type || incomingCall?.call?.type || "voice";
  const isVideoCall = callType === "video";

  return (
    <CallContext.Provider value={{ initiateCall, activeCall, incomingCall }}>
      {children}

      {/* ══════ INCOMING CALL OVERLAY ══════ */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gradient-to-b from-wa-dark via-wa-dark to-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-wa-accent/20 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <Avatar
                  src={incomingCall.from.avatar}
                  name={incomingCall.from.name}
                  size="xl"
                />
              </div>
            </motion.div>

            <h2 className="text-white text-2xl font-bold">
              {incomingCall.from.name}
            </h2>
            <p className="text-white/50 mt-2 text-lg">
              {isVideoCall ? t.videoCall : t.voiceCall}{" "}
              {t.incoming.toLowerCase()}...
            </p>

            <div className="flex gap-16 mt-20">
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleRejectCall}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
                <span className="text-white/50 text-xs">Tolak</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAcceptCall}
                  className="w-16 h-16 bg-wa-accent rounded-full flex items-center justify-center shadow-lg shadow-wa-accent/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Phone className="w-7 h-7 text-white" />
                </motion.button>
                <span className="text-white/50 text-xs">Terima</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ ACTIVE CALL OVERLAY ══════ */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-wa-dark flex flex-col"
          >
            {isVideoCall ? (
              <>
                {/* Remote video (full screen) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                {/* Local video (pip) */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute top-16 right-4 w-28 h-40 rounded-2xl object-cover shadow-xl border-2 border-white/20 bg-wa-darkSurface z-10"
                />
                {/* Status overlay */}
                <div className="absolute top-4 left-0 right-0 text-center z-10">
                  <p className="text-white font-semibold text-lg drop-shadow">
                    {activeCall.targetName}
                  </p>
                  <p className="text-white/60 text-sm drop-shadow">
                    {callState === "ringing"
                      ? t.ringing
                      : callState === "connecting"
                        ? "Menghubungkan..."
                        : formatDuration(callDuration)}
                  </p>
                </div>
              </>
            ) : (
              /* Voice call UI */
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-wa-primary to-wa-dark">
                <motion.div
                  animate={
                    callState === "active" ? {} : { scale: [1, 1.05, 1] }
                  }
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Avatar
                    src={activeCall.targetAvatar}
                    name={activeCall.targetName}
                    size="xl"
                  />
                </motion.div>
                <h2 className="text-white text-2xl font-bold mt-6">
                  {activeCall.targetName}
                </h2>
                <p className="text-white/50 mt-2 text-lg">
                  {callState === "ringing"
                    ? t.ringing
                    : callState === "connecting"
                      ? "Menghubungkan..."
                      : formatDuration(callDuration)}
                </p>
                {/* Hidden audio elements */}
                <audio ref={remoteVideoRef as any} autoPlay />
              </div>
            )}

            {/* Call controls */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-10">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleMute}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                  isMuted ? "bg-white text-wa-dark" : "bg-white/20 text-white",
                )}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </motion.button>

              {isVideoCall && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={toggleVideo}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                    isVideoOff
                      ? "bg-white text-wa-dark"
                      : "bg-white/20 text-white",
                  )}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6" />
                  ) : (
                    <Video className="w-6 h-6" />
                  )}
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleEndCall}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}
