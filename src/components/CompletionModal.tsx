"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, X, Heart } from "lucide-react";
import { formatKolkataDateTime } from "@/lib/timezone";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedAt?: string | null;
}

export function CompletionModal({
  isOpen,
  onClose,
  completedAt,
}: CompletionModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger signature emoji fireworks celebration
      window.dispatchEvent(new CustomEvent("sibaq:trigger-fireworks"));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/50 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 25 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md oneui-card-elevated p-8 text-center border border-[#A3B18A]/35 shadow-2xl overflow-hidden"
        >
          {/* Subtle Sage & Lime Celebration Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#E9EDC9]/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#A3B18A]/30 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-emerald-100 text-emerald-800 transition-colors"
            aria-label="Close celebration modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Check & Floral Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-4"
            >
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </motion.div>

            <span className="text-3xl mb-1">🌸 ✨ 🌿</span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-forest mb-2">
              Jazākallāhu khair! 🌿
            </h2>

            <p className="text-base text-emerald-800 font-medium mb-4 leading-relaxed">
              Alhamdulillah, today&apos;s Nariath Swalath task is complete.
            </p>

            <div className="inline-flex flex-col items-center bg-white/90 border border-gold/40 rounded-2xl px-6 py-3 shadow-inner mb-5">
              <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">
                Daily Dhikr Fulfilled
              </span>
              <span className="text-2xl font-black text-forest">
                33 / 33 — Completed
              </span>
              <span className="text-xs text-emerald-600 font-medium mt-0.5">
                {formatKolkataDateTime(completedAt || new Date().toISOString())}
              </span>
            </div>

            <p className="text-xs text-emerald-700/80 max-w-xs mb-6">
              May Allah accept your recitations, bring solace to your heart, and shower His abundant blessings upon your Sibaq journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("sibaq:trigger-fireworks"));
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-dark to-gold text-forest font-bold text-sm shadow hover:brightness-105 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>More Fireworks</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Alhamdulillah</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
