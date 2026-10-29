"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { Sparkles } from "lucide-react";

interface HugeSadEmojiProps {
  completedCount: number;
  targetCount?: number;
}

export function HugeSadEmoji({
  completedCount,
  targetCount = 33,
}: HugeSadEmojiProps) {
  const { preferences } = useTheme();
  const isComplete = completedCount >= targetCount;
  const remaining = Math.max(0, targetCount - completedCount);

  // If complete, this component is replaced by the celebratory state
  if (isComplete) {
    return null;
  }

  const shouldAnimate = preferences.animation_mode === "full";

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key="incomplete-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        aria-label="Daily task status reminder"
        className="w-full max-w-xl mx-auto rounded-[2rem] p-6 md:p-8 text-center oneui-card relative overflow-hidden"
      >
        {/* Soft garden background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E9EDC9]/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#A3B18A]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* CRITICAL SPEC: Giant Sad/Crying Emoji (150-200px desktop, 110-160px mobile) */}
          <div
            className={`select-none my-3 ${
              shouldAnimate ? "animate-sadBob" : ""
            }`}
            style={{
              fontSize: "clamp(115px, 22vw, 175px)",
              lineHeight: 1.1,
              filter: "drop-shadow(0 12px 24px rgba(52, 78, 65, 0.12))",
            }}
            role="img"
            aria-label="Crying emoji showing task is awaiting completion"
          >
            😢
          </div>

          {/* Dynamic Encouraging Message */}
          <h3 className="text-xl md:text-2xl font-bold text-forest mb-2 flex items-center justify-center gap-2">
            Today&apos;s task is still waiting for you <span className="text-[#A3B18A]">🌱</span>
          </h3>

          <p className="text-base md:text-lg text-forest/90 font-medium mb-3">
            {completedCount === 0 ? (
              <span>Your peaceful garden hasn&apos;t started today yet. 0 of 33 recitations recorded.</span>
            ) : (
              <span>
                You&apos;ve completed <strong className="text-forest font-bold">{completedCount}</strong> of{" "}
                <strong>{targetCount}</strong> recitations.
              </span>
            )}
          </p>

          <div className="inline-flex items-center gap-2 bg-[#E9EDC9]/70 text-forest px-4 py-1.5 rounded-full text-sm font-semibold border border-[#A3B18A]/35 mb-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#344E41]" />
            <span>{remaining} more Swalath needed today</span>
          </div>

          <p className="text-xs md:text-sm text-emerald-600/80 mt-1 max-w-sm">
            Take a deep breath and recite with love and peace whenever you&apos;re ready.
          </p>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
