"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider, useTheme } from "@/components/ThemeContext";
import { FloatingGardenBackground } from "@/components/FloatingGardenBackground";
import { MousePointerAura } from "@/components/MousePointerAura";
import { EmojiFireworks, triggerEmojiFireworks } from "@/components/EmojiFireworks";
import { ProgressRing } from "@/components/ProgressRing";
import { BoyJourneyAnimation } from "@/components/BoyJourneyAnimation";
import { PeacefulPauseModal } from "@/components/PeacefulPauseModal";
import { CompletionModal } from "@/components/CompletionModal";
import { SettingsModal } from "@/components/SettingsModal";
import { Navbar } from "@/components/Navbar";
import {
  CandidateSafe,
  DailyTask,
  RecitationTimingStats,
} from "@/lib/types";
import {
  DEFAULT_NARIATH_SWALATH_TEXT,
  DEFAULT_NARIATH_SWALATH_TRANSLITERATION,
  DEFAULT_NARIATH_SWALATH_MEANING,
} from "@/lib/recitation";
import {
  RotateCcw,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Sliders,
  Maximize2,
  Minimize2,
  Columns,
} from "lucide-react";

// 5 canonical phrases with generous line spacing & A-to-Z moving underline animations
const SWALATH_LINES = [
  "اللَّهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلَى سَيِّدِنَا مُحَمَّدٍ",
  "الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ",
  "وَتُقْضَى بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِيمِ",
  "وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ",
  "وَعَلَى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ",
];

export type SplitRatioKey = "80-20" | "70-30" | "65-35" | "60-40";

interface SplitOption {
  key: SplitRatioKey;
  label: string;
  videoPercent: number;
  counterPercent: number;
  videoWidth: string;
  counterWidth: string;
  videoClass: string;
  counterClass: string;
  title: string;
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    key: "80-20",
    label: "80 / 20",
    videoPercent: 80,
    counterPercent: 20,
    videoWidth: "80%",
    counterWidth: "20%",
    videoClass: "lg:w-[80%]",
    counterClass: "lg:w-[20%]",
    title: "80% Boy Video / 20% Task Counter",
  },
  {
    key: "70-30",
    label: "70 / 30",
    videoPercent: 70,
    counterPercent: 30,
    videoWidth: "70%",
    counterWidth: "30%",
    videoClass: "lg:w-[70%]",
    counterClass: "lg:w-[30%]",
    title: "70% Boy Video / 30% Task Counter",
  },
  {
    key: "65-35",
    label: "65 / 35",
    videoPercent: 65,
    counterPercent: 35,
    videoWidth: "65%",
    counterWidth: "35%",
    videoClass: "lg:w-[65%]",
    counterClass: "lg:w-[35%]",
    title: "65% Boy Video / 35% Task Counter",
  },
  {
    key: "60-40",
    label: "60 / 40",
    videoPercent: 60,
    counterPercent: 40,
    videoWidth: "60%",
    counterWidth: "40%",
    videoClass: "lg:w-[60%]",
    counterClass: "lg:w-[40%]",
    title: "60% Boy Video / 40% Task Counter",
  },
];

function DashboardContent() {
  const router = useRouter();
  const { preferences } = useTheme();

  // Core Data States
  const [user, setUser] = useState<CandidateSafe | null>(null);
  const [task, setTask] = useState<DailyTask | null>(null);
  const [stats, setStats] = useState<RecitationTimingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Layout View Mode: Fullscreen Toggle (Focus large text & avoid video)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layout Split Ratio Choice: 80/20, 70/30, 65/35, 60/40
  const [splitRatio, setSplitRatio] = useState<SplitRatioKey>("80-20");

  // Recitation Pace: Set strictly to 14 seconds per Swalath
  const [recitationPace, setRecitationPace] = useState(14);
  const [recitationElapsed, setRecitationElapsed] = useState(0);
  const [isRecitingActive, setIsRecitingActive] = useState(true);
  const [isCounting, setIsCounting] = useState(false);

  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showPaceSelector, setShowPaceSelector] = useState(false);

  // Load User & Today's Task + Split Ratio Preference
  useEffect(() => {
    async function loadInitialData() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        const taskRes = await fetch("/api/tasks/today");
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTask(taskData.task);
          setStats(taskData.stats);
        }

        // Load saved split ratio preference
        if (typeof window !== "undefined") {
          const savedRatio = localStorage.getItem("sibaq_split_ratio") as SplitRatioKey;
          if (savedRatio && ["80-20", "70-30", "65-35", "60-40"].includes(savedRatio)) {
            setSplitRatio(savedRatio);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [router]);

  // Handle changing layout split ratio with localStorage persistence
  const handleSplitChange = (newRatio: SplitRatioKey) => {
    setSplitRatio(newRatio);
    if (typeof window !== "undefined") {
      localStorage.setItem("sibaq_split_ratio", newRatio);
    }
  };

  // Continuous "A to Z Line" Less-Opacity Fill Animation
  // Advances smoothly over the recitation duration (14s).
  // A user can ONLY advance to the next count when this fill completes (reaches 100%).
  useEffect(() => {
    if (!task || task.completed_count >= 33 || !isRecitingActive) return;

    const intervalMs = 100;
    const increment = intervalMs / 1000;

    const timer = setInterval(() => {
      setRecitationElapsed((prev) => {
        const next = prev + increment;
        if (next >= recitationPace) {
          return recitationPace; // Fill reached 100% (completed A to Z line)
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [task?.completed_count, isRecitingActive, recitationPace, task]);

  // Percentage of fill going across the Swalath lines (0% to 100%)
  const fillPercent = Math.min(100, Math.max(0, (recitationElapsed / recitationPace) * 100));
  const canAdvance = fillPercent >= 100;
  const remainingSeconds = Math.max(0, Math.ceil(recitationPace - recitationElapsed));

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Count confirmed recitation (+1) — only allowed once the 14s fill reaches 100%
  const handleCount = async () => {
    if (isCounting || !task || task.completed_count >= 33 || !canAdvance) return;

    setIsCounting(true);

    try {
      const res = await fetch("/api/tasks/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationSeconds: Math.round(recitationPace) }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTask(data.task);
        setStats(data.stats);

        // Reset the "A to Z line" fill animation for the next recitation routine!
        setRecitationElapsed(0);

        // If completed 33/33 just now, open celebration!
        if (data.isNewCompletion) {
          setIsCompletionOpen(true);
        }
      }
    } catch (err) {
      console.error("Count increment failed:", err);
    } finally {
      setTimeout(() => setIsCounting(false), 250);
    }
  };

  // Undo recitation (-1)
  const handleUndo = async () => {
    if (!task || task.completed_count <= 0) return;
    setShowUndoConfirm(false);

    try {
      const res = await fetch("/api/tasks/undo", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTask(data.task);
        setStats(data.stats);
        setRecitationElapsed(0);
      }
    } catch (err) {
      console.error("Undo failed:", err);
    }
  };

  const triggerFireworks = () => {
    window.dispatchEvent(new CustomEvent("sibaq:trigger-fireworks"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">🌿</span>
          <p className="text-sm font-semibold text-forest">
            Entering your Sibaq peaceful garden...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !task) return null;

  const currentCount = task.completed_count;
  const isComplete = currentCount >= 33;

  // Active split configuration
  const activeSplit = SPLIT_OPTIONS.find((s) => s.key === splitRatio) || SPLIT_OPTIONS[0];

  // Dynamic sizing based on split ratio or fullscreen mode
  let ringSize = 115;
  let ringStroke = 9;
  let arabicClass = "text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed";

  if (isFullscreen) {
    ringSize = 180;
    ringStroke = 12;
    arabicClass = "text-2xl sm:text-3xl md:text-4xl leading-[2.6] md:leading-[3.0]";
  } else if (splitRatio === "60-40") {
    ringSize = 145;
    ringStroke = 11;
    arabicClass = "text-base sm:text-lg md:text-xl leading-[2.3] md:leading-[2.6]";
  } else if (splitRatio === "65-35") {
    ringSize = 135;
    ringStroke = 10;
    arabicClass = "text-sm sm:text-base md:text-lg leading-[2.1] md:leading-[2.4]";
  } else if (splitRatio === "70-30") {
    ringSize = 125;
    ringStroke = 9;
    arabicClass = "text-[14px] sm:text-[15px] md:text-base leading-relaxed md:leading-[2.2]";
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#FAF9F6]">
      <FloatingGardenBackground />
      <MousePointerAura />
      <EmojiFireworks />

      {/* Top Navigation Bar with Greeting & Controls */}
      <Navbar
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPeacefulPause={() => setIsPauseOpen(true)}
        onTriggerFireworks={triggerFireworks}
      />

      {/* =========================================================================
          MAIN WORKSPACE — 100VH WITH NAVBAR
          - Selectable layout split ratio:
              1. 80% video / 20% counter
              2. 70% video / 30% counter
              3. 65% video / 35% counter
              4. 60% video / 40% counter
          - Fullscreen mode: Swalath task counter expands to 100% width with large font
            (animation video is hidden so users who cannot read small text can recite comfortably)
         ========================================================================= */}
      <div className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row relative z-10">

        {/* Boy Animation Video Section (smoothly resizes according to user's ratio selection) */}
        {!isFullscreen && (
          <div
            className={`w-full ${activeSplit.videoClass} h-[40vh] sm:h-[45vh] lg:h-full relative overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-[#A3B18A]/25 transition-all duration-300 ease-in-out`}
            style={{ flexBasis: activeSplit.videoWidth }}
          >
            <BoyJourneyAnimation currentCount={currentCount} targetCount={33} />
          </div>
        )}

        {/* Remaining Portion: Swalath Task Counter & Recitation Panel (smoothly resizes according to selection) */}
        <div
          className={`w-full ${
            isFullscreen
              ? "w-full max-w-4xl mx-auto h-full px-6 py-6 md:px-10 md:py-8"
              : `${activeSplit.counterClass} h-[60vh] sm:h-[55vh] lg:h-full p-3 sm:p-4 md:p-5`
          } flex flex-col bg-white/95 backdrop-blur-xl overflow-y-auto justify-between shadow-2xl relative z-20 transition-all duration-300 ease-in-out`}
          style={!isFullscreen ? { flexBasis: activeSplit.counterWidth } : undefined}
        >
          {/* TOP SECTION: Header with Split Ratio Chooser, Fullscreen Icon, Progress Ring & Timer */}
          <div className="flex flex-col items-center w-full">
            {/* Header bar: Title + Layout Size Selector + Fullscreen Toggle Button */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#A3B18A]/20">
              <div className="flex items-center gap-1.5 min-w-0">
                <BookOpen className="w-4 h-4 text-[#176B50] shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-forest tracking-tight truncate">
                  Nariath Swalath
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* User Selectable Split Ratio Pills (70/30, 65/35, 80/20, 60/40) */}
                {!isFullscreen && (
                  <div className="flex items-center bg-[#FAF9F6] p-0.5 rounded-xl border border-[#A3B18A]/30 shadow-inner">
                    <span className="text-[10px] font-bold text-forest/60 px-1 hidden xl:inline">
                      Split:
                    </span>
                    {SPLIT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSplitChange(opt.key)}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all duration-200 ${
                          splitRatio === opt.key
                            ? "bg-[#344E41] text-[#FAF9F6] shadow-sm scale-100"
                            : "text-forest/70 hover:text-forest hover:bg-[#E9EDC9]/60"
                        }`}
                        title={opt.title}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Fullscreen icon button for users who want large text focus without animation */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF9F6] hover:bg-[#E9EDC9]/70 border border-[#A3B18A]/30 text-forest text-xs font-bold transition-all shadow-sm active:scale-95"
                  title={isFullscreen ? "Exit Fullscreen (Restore Video)" : "Fullscreen Mode (Large text focus, hide animation)"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-forest" />
                      <span>Exit</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-forest" />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Circular Progress Ring (dynamically responsive to split size) */}
            <div className="my-1 relative flex items-center justify-center">
              <ProgressRing
                currentCount={currentCount}
                targetCount={33}
                size={ringSize}
                strokeWidth={ringStroke}
              />
            </div>

            {/* 14s Timer & Pace Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-2 mb-2 flex-wrap">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E9EDC9]/70 border border-[#A3B18A]/35 text-forest text-[11px] font-bold">
                <Clock className="w-3 h-3 text-[#344E41]" />
                <span>
                  {isComplete
                    ? "Alhamdulillah 33/33 Complete"
                    : canAdvance
                    ? "✓ 14s Done — Ready to Count"
                    : `Reciting • ~${remainingSeconds}s remaining`}
                </span>
              </div>

              {/* Pause/Resume Recitation Timer */}
              {!isComplete && (
                <button
                  type="button"
                  onClick={() => setIsRecitingActive(!isRecitingActive)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#FAF9F6] border border-[#A3B18A]/30 text-forest hover:bg-white transition-colors"
                  title={isRecitingActive ? "Pause timer" : "Resume timer"}
                >
                  {isRecitingActive ? (
                    <>
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 14s Continuous Recitation Progress Bar */}
            {!isComplete && (
              <div className="w-full mt-1 mb-2">
                <div className="w-full h-1.5 bg-[#F0F1E9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A3B18A] via-[#52796F] to-[#344E41] rounded-full transition-all duration-150 ease-linear"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* MIDDLE SECTION: Nariath Swalath Arabic Lines with Moving Underlines A to Z */}
          <div className="flex-1 w-full my-2 flex flex-col justify-center">
            <div
              className={`w-full rounded-2xl bg-[#FAF9F6]/80 border border-[#A3B18A]/25 ${
                isFullscreen ? "p-6 md:p-8" : "p-3 sm:p-4"
              } shadow-inner flex flex-col justify-center`}
              dir="rtl"
            >
              <div className={`flex flex-col ${isFullscreen ? "gap-6 md:gap-8 my-3" : "gap-2.5 sm:gap-3.5 my-1"}`}>
                {SWALATH_LINES.map((line, idx) => {
                  const lineStart = (idx / SWALATH_LINES.length) * recitationPace;
                  const lineEnd = ((idx + 1) / SWALATH_LINES.length) * recitationPace;
                  const lineDuration = lineEnd - lineStart;
                  const lineProgress = Math.min(1, Math.max(0, (recitationElapsed - lineStart) / lineDuration));
                  const isLineComplete = canAdvance || isComplete || lineProgress >= 1;
                  const isLineActive =
                    isRecitingActive &&
                    !canAdvance &&
                    !isComplete &&
                    recitationElapsed >= lineStart &&
                    recitationElapsed < lineEnd;

                  return (
                    <div key={idx} className="relative group text-center px-1">
                      {/* Arabic Typography: Responsive size according to split ratio and Fullscreen mode */}
                      <p
                        className={`font-arabic font-bold transition-all duration-200 select-text ${arabicClass} ${
                          isLineActive
                            ? "text-[#14251F] font-extrabold scale-[1.01]"
                            : isLineComplete
                            ? "text-[#344E41]"
                            : "text-forest/70"
                        }`}
                      >
                        {line}
                      </p>

                      {/* Moving Underline Track from A to Z (Right to Left in Arabic) over 14s */}
                      <div
                        className={`w-full max-w-xl mx-auto rounded-full bg-[#E9EDC9]/50 relative overflow-hidden shadow-inner ${
                          isFullscreen ? "h-2 mt-2" : "h-1 mt-1.5"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-100 ease-linear ${
                            isLineComplete
                              ? "bg-gradient-to-l from-[#176B50] via-[#203D32] to-[#176B50]"
                              : isLineActive
                              ? "bg-gradient-to-l from-[#D8B56D] via-[#176B50] to-[#203D32] shadow-[0_0_8px_rgba(216,181,109,0.8)]"
                              : "bg-transparent"
                          }`}
                          style={{
                            width: `${(canAdvance || isComplete ? 1 : lineProgress) * 100}%`,
                            transformOrigin: "right",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Translation & Transliteration Accordion */}
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-[11px] text-forest/80 hover:text-forest font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <span>{showTranslation ? "Hide Meaning" : "Show Meaning & Transliteration"}</span>
                {showTranslation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <AnimatePresence>
                {showTranslation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-left w-full mt-2 space-y-2 text-[11px] text-forest bg-[#FAF9F6] p-3 rounded-xl border border-[#A3B18A]/25"
                  >
                    <div>
                      <strong className="block text-forest mb-0.5 font-bold">Transliteration:</strong>
                      <p className="italic leading-relaxed text-forest/90">{DEFAULT_NARIATH_SWALATH_TRANSLITERATION}</p>
                    </div>
                    <div className="pt-1.5 border-t border-[#A3B18A]/20">
                      <strong className="block text-forest mb-0.5 font-bold">English Meaning:</strong>
                      <p className="leading-relaxed text-forest/90">{DEFAULT_NARIATH_SWALATH_MEANING}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* BOTTOM SECTION: Touch Count Button & Undo Action */}
          <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#A3B18A]/15">
            <motion.button
              whileHover={{ scale: canAdvance && !isComplete ? 1.02 : 1 }}
              whileTap={{ scale: canAdvance && !isComplete ? 0.96 : 1 }}
              onClick={handleCount}
              disabled={isCounting || isComplete || !canAdvance}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                isComplete
                  ? "bg-[#E9EDC9] text-forest border border-[#A3B18A]/50 cursor-default"
                  : canAdvance
                  ? "bg-gradient-to-r from-[#344E41] via-[#2C4237] to-[#344E41] text-[#FAF9F6] shadow-forest/20 hover:shadow-forest/30 cursor-pointer animate-pulse"
                  : "bg-[#F0F1E9] text-forest/50 border border-[#A3B18A]/30 cursor-not-allowed shadow-none"
              }`}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#344E41]" />
                  <span>Task Complete (33 / 33)</span>
                </>
              ) : canAdvance ? (
                <>
                  <span className="text-lg">📿</span>
                  <span>Confirm Swalath ({currentCount + 1}/33) &amp; Next</span>
                </>
              ) : (
                <>
                  <span className="text-sm animate-spin">⏳</span>
                  <span>Reciting ({remainingSeconds}s)...</span>
                </>
              )}
            </motion.button>

            {/* Note on button locking until 14s completes */}
            {!isComplete && !canAdvance && (
              <p className="text-[10px] text-forest/60 font-medium text-center">
                Button unlocks automatically after 14s recitation.
              </p>
            )}

            {/* Undo Count Action */}
            {currentCount > 0 && (
              <div className="flex items-center justify-center gap-2">
                {!showUndoConfirm ? (
                  <button
                    onClick={() => setShowUndoConfirm(true)}
                    className="text-[11px] text-forest/75 hover:text-rose-700 inline-flex items-center gap-1 transition-colors px-2 py-0.5 rounded"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Undo Last Count</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] text-rose-700">
                    <span>Undo to {currentCount - 1}?</span>
                    <button onClick={handleUndo} className="font-bold underline hover:text-rose-900">
                      Yes
                    </button>
                    <button onClick={() => setShowUndoConfirm(false)} className="text-gray-500 hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PeacefulPauseModal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        currentCount={currentCount}
      />

      <CompletionModal
        isOpen={isCompletionOpen}
        onClose={() => setIsCompletionOpen(false)}
        completedAt={task.completed_at}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        candidateName={user.name}
        admissionNo={user.admission_no}
      />
    </div>
  );
}

export default function CandidateDashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
