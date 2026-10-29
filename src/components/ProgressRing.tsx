"use client";

import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressRingProps {
  currentCount: number;
  targetCount?: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  currentCount,
  targetCount = 33,
  size = 220,
  strokeWidth = 14,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(100, Math.max(0, (currentCount / targetCount) * 100));
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
  const isComplete = currentCount >= targetCount;

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 origin-center"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(163, 177, 138, 0.22)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isComplete ? "#D8B56D" : "#344E41"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: "stroke-dashoffset 0.45s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease",
          }}
        />
      </svg>

      {/* Center Counter Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-[#344E41] text-white flex items-center justify-center shadow-md mb-1">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <span className="text-2xl font-bold text-forest">33 / 33</span>
            <span className="text-xs font-semibold text-[#A3B18A] uppercase tracking-wider">
              Completed
            </span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <motion.span
              key={currentCount}
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-4xl md:text-5xl font-extrabold text-forest tracking-tight"
            >
              {currentCount}
            </motion.span>
            <span className="text-sm font-semibold text-forest/75 mt-0.5">
              / {targetCount}
            </span>
            <span className="text-xs text-[#A3B18A] font-bold mt-1">
              {Math.round(progressPercent)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
