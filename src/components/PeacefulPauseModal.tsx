"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { relaxAudio } from "@/lib/relaxAudio";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowLeft,
  Waves,
  Sparkles,
  Compass,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface PeacefulPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
}

type SessionType = "menu" | "waves" | "pattern" | "breathing";

const MAX_DAILY_SESSIONS = 5;

// Helper to get today's date string YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PeacefulPauseModal({
  isOpen,
  onClose,
  currentCount,
}: PeacefulPauseModalProps) {
  const { preferences } = useTheme();

  // Session state
  const [activeSession, setActiveSession] = useState<SessionType>("menu");
  const [dailyUsageCount, setDailyUsageCount] = useState<number>(0);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState<boolean>(false);

  // Audio controls
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.4);

  // 60-Second Pattern Session timer
  const [patternTimer, setPatternTimer] = useState<number>(60);
  const [isPatternComplete, setIsPatternComplete] = useState<boolean>(false);
  const [isPatternPlaying, setIsPatternPlaying] = useState<boolean>(true);

  // Breathing state
  const [isBreathingActive, setIsBreathingActive] = useState(true);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale (4s)" | "Hold (7s)" | "Exhale (8s)">("Inhale (4s)");

  // Canvas refs for Waves and Pattern video sequences
  const wavesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wavesAnimRef = useRef<number | null>(null);
  const patternAnimRef = useRef<number | null>(null);
  const wavesCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const patternCache = useRef<Map<number, HTMLImageElement>>(new Map());

  // Load daily usage on modal open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const today = getTodayString();
      const stored = localStorage.getItem(`sibaq_pause_usage_${today}`);
      const used = stored ? parseInt(stored, 10) : 0;
      setDailyUsageCount(used);
      setIsDailyLimitReached(used >= MAX_DAILY_SESSIONS);
    } catch {
      setDailyUsageCount(0);
      setIsDailyLimitReached(false);
    }
  }, [isOpen]);

  // Record a session when user starts one of the 3 sessions
  const recordSessionUsage = () => {
    try {
      const today = getTodayString();
      const stored = localStorage.getItem(`sibaq_pause_usage_${today}`);
      const used = stored ? parseInt(stored, 10) : 0;
      const nextCount = used + 1;
      localStorage.setItem(`sibaq_pause_usage_${today}`, String(nextCount));
      setDailyUsageCount(nextCount);
      if (nextCount >= MAX_DAILY_SESSIONS) {
        setIsDailyLimitReached(true);
      }
    } catch {}
  };

  // -------------------------------------------------------------
  // Session 1: Waves Video Loop & Web Audio Synthesizer
  // -------------------------------------------------------------
  const preloadWaveFrame = (num: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (wavesCache.current.has(num)) {
        resolve(wavesCache.current.get(num)!);
        return;
      }
      const img = new Image();
      img.src = `/pause-waves/${String(num).padStart(4, "0")}.jpg`;
      img.onload = () => {
        wavesCache.current.set(num, img);
        resolve(img);
      };
      img.onerror = () => resolve(img);
    });
  };

  useEffect(() => {
    if (activeSession !== "waves" || !isOpen) {
      relaxAudio.stop();
      if (wavesAnimRef.current) cancelAnimationFrame(wavesAnimRef.current);
      return;
    }

    // Start waves audio synthesizer with relaxing pentatonic melody
    if (!isAudioMuted) {
      relaxAudio.start(audioVolume);
    }

    let isMounted = true;
    let frame = 1;
    let lastTime = performance.now();
    const frameInterval = 42; // ~24 fps smooth cinematic wave loop

    // Preload first 20 frames immediately
    for (let i = 1; i <= 30; i++) preloadWaveFrame(i);

    const loopWaves = (now: number) => {
      if (!isMounted) return;
      if (now - lastTime >= frameInterval) {
        frame = frame >= 240 ? 1 : frame + 1;
        lastTime = now;

        const canvas = wavesCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = wavesCache.current.get(frame);
          if (ctx && img && img.complete) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
        preloadWaveFrame(frame >= 240 ? 1 : frame + 1);
      }
      wavesAnimRef.current = requestAnimationFrame(loopWaves);
    };

    wavesAnimRef.current = requestAnimationFrame(loopWaves);

    return () => {
      isMounted = false;
      relaxAudio.stop();
      if (wavesAnimRef.current) cancelAnimationFrame(wavesAnimRef.current);
    };
  }, [activeSession, isOpen, isAudioMuted, audioVolume]);

  // -------------------------------------------------------------
  // Session 2: Cool Pattern Video Loop & 60-Second Timer
  // -------------------------------------------------------------
  const preloadPatternFrame = (num: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (patternCache.current.has(num)) {
        resolve(patternCache.current.get(num)!);
        return;
      }
      const img = new Image();
      img.src = `/pause-patterns/${String(num).padStart(4, "0")}.jpg`;
      img.onload = () => {
        patternCache.current.set(num, img);
        resolve(img);
      };
      img.onerror = () => resolve(img);
    });
  };

  useEffect(() => {
    if (activeSession !== "pattern" || !isOpen) {
      if (patternAnimRef.current) cancelAnimationFrame(patternAnimRef.current);
      return;
    }

    let isMounted = true;
    let frame = 1;
    let lastTime = performance.now();
    const frameInterval = 33; // ~30 fps hypnotic optical loop

    for (let i = 1; i <= 30; i++) preloadPatternFrame(i);

    const loopPattern = (now: number) => {
      if (!isMounted) return;
      if (isPatternPlaying && now - lastTime >= frameInterval) {
        frame = frame >= 240 ? 1 : frame + 1;
        lastTime = now;

        const canvas = patternCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = patternCache.current.get(frame);
          if (ctx && img && img.complete) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }
        preloadPatternFrame(frame >= 240 ? 1 : frame + 1);
      }
      patternAnimRef.current = requestAnimationFrame(loopPattern);
    };

    patternAnimRef.current = requestAnimationFrame(loopPattern);

    return () => {
      isMounted = false;
      if (patternAnimRef.current) cancelAnimationFrame(patternAnimRef.current);
    };
  }, [activeSession, isOpen, isPatternPlaying]);

  // 60-second countdown timer for pattern session
  useEffect(() => {
    if (activeSession !== "pattern" || !isOpen || !isPatternPlaying) return;

    if (patternTimer <= 0) {
      setIsPatternComplete(true);
      return;
    }

    const timer = setInterval(() => {
      setPatternTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPatternComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession, isOpen, isPatternPlaying, patternTimer]);

  // -------------------------------------------------------------
  // Session 3: Mindful Islamic Breathing (Inhale - Hold - Exhale)
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeSession !== "breathing" || !isOpen || !isBreathingActive) return;

    let timeout: any;
    const runCycle = () => {
      setBreathingPhase("Inhale (4s)");
      timeout = setTimeout(() => {
        setBreathingPhase("Hold (7s)");
        timeout = setTimeout(() => {
          setBreathingPhase("Exhale (8s)");
          timeout = setTimeout(() => {
            runCycle();
          }, 8000);
        }, 7000);
      }, 4000);
    };

    runCycle();

    return () => clearTimeout(timeout);
  }, [activeSession, isOpen, isBreathingActive]);

  // Audio volume toggle
  const toggleMute = () => {
    if (isAudioMuted) {
      setIsAudioMuted(false);
      relaxAudio.start(audioVolume);
    } else {
      setIsAudioMuted(true);
      relaxAudio.stop();
    }
  };

  const handleClose = () => {
    relaxAudio.stop();
    setActiveSession("menu");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl border border-[#A3B18A]/35 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#A3B18A]/20 bg-[#FAF9F6] shrink-0">
            <div className="flex items-center gap-2.5">
              {activeSession !== "menu" && (
                <button
                  onClick={() => {
                    relaxAudio.stop();
                    setActiveSession("menu");
                  }}
                  className="p-1.5 rounded-full hover:bg-white text-forest border border-[#A3B18A]/25 transition-colors mr-1"
                  title="Back to Sessions Menu"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-9 h-9 rounded-2xl bg-[#14251F] text-[#E9EDC9] flex items-center justify-center text-lg shadow-sm">
                🌿
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-forest tracking-tight">
                  {activeSession === "menu" && "PEACEFUL PAUSE • ശാന്തമായ ഇടവേള"}
                  {activeSession === "waves" && "Session 1: Ocean Waves & Relaxing Melody"}
                  {activeSession === "pattern" && "Session 2: Hypnotic Pattern Reset (60s)"}
                  {activeSession === "breathing" && "Session 3: Mindful Islamic Breathing"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-forest/75 font-semibold">
                  <span>Daily Allowance: {dailyUsageCount} / {MAX_DAILY_SESSIONS} used</span>
                  <span className="text-[#A3B18A]">•</span>
                  <span className="text-emerald-700">
                    {Math.max(0, MAX_DAILY_SESSIONS - dailyUsageCount)} remaining today
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white text-forest/70 hover:text-forest transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {/* Condition 1: Daily Limit Reached (5 times per day) */}
            {isDailyLimitReached && activeSession === "menu" ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-3xl shadow-inner">
                  ⏳
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-forest">
                  Daily Peaceful Pause Limit Reached (5/5)
                </h4>
                <p className="text-sm text-forest/80 max-w-md leading-relaxed">
                  You have completed your <strong>5 relaxation sessions</strong> for today. Take rest, stay hydrated, and return refreshed tomorrow inshaAllah.
                </p>
                <div className="p-4 rounded-2xl bg-[#E9EDC9]/50 border border-[#A3B18A]/30 text-xs text-forest max-w-sm">
                  <span>Current Task Progress: </span>
                  <strong className="font-bold text-forest">{currentCount} / 33 completed today</strong>
                </div>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full bg-forest text-white font-bold text-xs shadow-lg hover:bg-forest/90 transition-all active:scale-95"
                >
                  Return to Dhikr
                </button>
              </div>
            ) : activeSession === "menu" ? (
              /* Condition 2: Session Selection Menu (User chooses based on interest) */
              <div className="space-y-4">
                <div className="text-left mb-3">
                  <h4 className="text-sm font-bold text-forest uppercase tracking-wider">
                    Select Your Relaxation Session
                  </h4>
                  <p className="text-xs text-forest/75 font-medium">
                    Choose one of 3 peaceful practices to refresh your heart and mind during Sibaq:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {/* Session 1 Card */}
                  <motion.div
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      recordSessionUsage();
                      setActiveSession("waves");
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border-2 border-[#A3B18A]/30 hover:border-[#176B50] cursor-pointer transition-all shadow-sm flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-900 text-white flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                        🌊
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm sm:text-base text-forest">
                            Session 1: Ocean Waves & Relaxing Melody
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold uppercase">
                            Audio & Visual
                          </span>
                        </div>
                        <p className="text-xs text-forest/75 font-medium mt-0.5">
                          Smooth rolling ocean surf video accompanied by gentle ambient wave sounds and 432Hz calming chimes.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-forest font-bold px-3 py-1.5 rounded-full bg-white border border-[#A3B18A]/30 group-hover:bg-forest group-hover:text-white transition-colors shrink-0">
                      Begin →
                    </span>
                  </motion.div>

                  {/* Session 2 Card */}
                  <motion.div
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      recordSessionUsage();
                      setPatternTimer(60);
                      setIsPatternComplete(false);
                      setIsPatternPlaying(true);
                      setActiveSession("pattern");
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border-2 border-[#A3B18A]/30 hover:border-[#176B50] cursor-pointer transition-all shadow-sm flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-900 text-white flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                        🌀
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm sm:text-base text-forest">
                            Session 2: Hypnotic Pattern (60 Seconds)
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase">
                            Focus Reset
                          </span>
                        </div>
                        <p className="text-xs text-forest/75 font-medium mt-0.5">
                          Mesmerizing 60-second optical pattern designed to break unconscious mental loops and restore sharp clarity.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-forest font-bold px-3 py-1.5 rounded-full bg-white border border-[#A3B18A]/30 group-hover:bg-forest group-hover:text-white transition-colors shrink-0">
                      Begin →
                    </span>
                  </motion.div>

                  {/* Session 3 Card */}
                  <motion.div
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      recordSessionUsage();
                      setActiveSession("breathing");
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border-2 border-[#A3B18A]/30 hover:border-[#176B50] cursor-pointer transition-all shadow-sm flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-white flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                        🫁
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm sm:text-base text-forest">
                            Session 3: Mindful Islamic Breathing
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                            4-7-8 Breathwork
                          </span>
                        </div>
                        <p className="text-xs text-forest/75 font-medium mt-0.5">
                          Guided rhythmic breathing orb with calming Inhale, Hold, and Exhale prompts for physical and spiritual tranquility.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-forest font-bold px-3 py-1.5 rounded-full bg-white border border-[#A3B18A]/30 group-hover:bg-forest group-hover:text-white transition-colors shrink-0">
                      Begin →
                    </span>
                  </motion.div>
                </div>
              </div>
            ) : activeSession === "waves" ? (
              /* Session 1 View: Ocean Waves Video & Audio */
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-cyan-900/30">
                  <canvas
                    ref={wavesCanvasRef}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Gentle Ocean Waves</span>
                  </div>
                </div>

                {/* Audio Controls for Ocean Waves & Melodies */}
                <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#A3B18A]/25 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl bg-white border border-[#A3B18A]/30 text-forest hover:bg-forest hover:text-white transition-all shadow-sm"
                      title={isAudioMuted ? "Unmute waves & melody" : "Mute audio"}
                    >
                      {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
                    </button>
                    <span className="text-xs font-bold text-forest">
                      {isAudioMuted ? "Audio Muted" : "Wave Sound & Melody Active 🎵"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-forest/75 font-medium">Volume:</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={audioVolume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setAudioVolume(v);
                        relaxAudio.setVolume(v);
                      }}
                      className="w-24 accent-forest"
                    />
                  </div>
                </div>

                <p className="text-xs text-center text-forest/80 italic">
                  &ldquo;Listen to the rhythmic surge of the water, and let all racing competition thoughts settle into stillness.&rdquo;
                </p>
              </div>
            ) : activeSession === "pattern" ? (
              /* Session 2 View: Hypnotic Pattern Video (60 Seconds) */
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-purple-900/30">
                  <canvas
                    ref={patternCanvasRef}
                    width={1280}
                    height={720}
                    className="w-full h-full object-cover"
                  />

                  {/* 60-Second Countdown HUD Pill */}
                  <div className="absolute top-3 right-3 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg border border-white/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                    <span>Focus Reset: {patternTimer}s</span>
                  </div>

                  {/* Complete Banner at 60s */}
                  {isPatternComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
                    >
                      <span className="text-4xl mb-2">✨</span>
                      <h4 className="text-lg font-extrabold text-[#E9EDC9]">
                        Mind Cleared &amp; Unconscious Loop Broken!
                      </h4>
                      <p className="text-xs text-white/80 max-w-sm mt-1">
                        60 seconds of focused pattern observation completed. Your mind is refreshed for dhikr.
                      </p>
                      <button
                        onClick={() => {
                          setPatternTimer(60);
                          setIsPatternComplete(false);
                        }}
                        className="mt-4 px-4 py-2 rounded-full bg-[#E9EDC9] text-forest font-bold text-xs"
                      >
                        Replay 60s Session
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Progress Bar of the 60s session */}
                <div className="w-full h-2 rounded-full bg-[#E9EDC9]/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((60 - patternTimer) / 60) * 100}%` }}
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#A3B18A]/25 text-xs text-center text-forest/80">
                  <p className="font-semibold text-forest mb-0.5">Instruction:</p>
                  <span>Fix your gaze softly at the center of the rotating vortex. Notice how repetitive mental noise dissolves into quiet awareness.</span>
                </div>
              </div>
            ) : (
              /* Session 3 View: Mindful Islamic Breathing */
              <div className="space-y-6 flex flex-col items-center text-center py-2">
                <div className="w-48 h-48 flex items-center justify-center relative">
                  {/* Outer ambient glow ring */}
                  <motion.div
                    animate={{
                      scale: breathingPhase.startsWith("Inhale")
                        ? [1, 1.3]
                        : breathingPhase.startsWith("Hold")
                        ? 1.3
                        : [1.3, 0.95],
                    }}
                    transition={{
                      duration: breathingPhase.startsWith("Inhale")
                        ? 4
                        : breathingPhase.startsWith("Hold")
                        ? 7
                        : 8,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#176B50]/30 via-[#A3B18A]/40 to-[#E9EDC9]/50 blur-xl"
                  />

                  {/* Pulsing Breathing Orb */}
                  <motion.div
                    animate={{
                      scale: breathingPhase.startsWith("Inhale")
                        ? [1, 1.25]
                        : breathingPhase.startsWith("Hold")
                        ? 1.25
                        : [1.25, 0.9],
                    }}
                    transition={{
                      duration: breathingPhase.startsWith("Inhale")
                        ? 4
                        : breathingPhase.startsWith("Hold")
                        ? 7
                        : 8,
                      ease: "easeInOut",
                    }}
                    className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#176B50] via-[#344E41] to-[#52796F] text-white flex flex-col items-center justify-center p-4 shadow-2xl z-10 border-2 border-white/40"
                  >
                    <span className="text-xs uppercase tracking-wider font-extrabold text-[#E9EDC9]">
                      {breathingPhase.split(" ")[0]}
                    </span>
                    <span className="text-[11px] text-white/80 font-mono mt-0.5">
                      {breathingPhase.split(" ")[1]}
                    </span>
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-forest">
                    {breathingPhase.startsWith("Inhale") && "Inhale divine serenity and mercy (Rahmah)..."}
                    {breathingPhase.startsWith("Hold") && "Hold with peaceful gratitude (Shukr)..."}
                    {breathingPhase.startsWith("Exhale") && "Exhale all tension and fatigue (Tawakkul)..."}
                  </h4>
                  <p className="text-xs text-forest/70 font-medium">
                    The 4-7-8 method oxygenates the brain, eases tension, and prepares your focus for the blessed Swalath.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Actions */}
          <div className="p-4 border-t border-[#A3B18A]/20 bg-[#FAF9F6] flex items-center justify-between shrink-0">
            <span className="text-xs text-forest/75 font-semibold">
              Current Dhikr: <strong className="text-forest font-bold">{currentCount} / 33</strong>
            </span>
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-full bg-forest text-white text-xs font-bold hover:bg-forest/90 transition-all active:scale-95 shadow-md"
            >
              Return to Dhikr
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
