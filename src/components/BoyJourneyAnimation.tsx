"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BoyJourneyAnimationProps {
  currentCount: number;
  targetCount?: number;
}

const TOTAL_FRAMES = 239;

// Format frame number to 4-digit filename: e.g. 1 -> "0001.jpg"
function getFramePath(frame: number): string {
  const clamped = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frame)));
  return `/boy-journey/${String(clamped).padStart(4, "0")}.jpg`;
}

// Calculate target frame index based on count (0 to 33)
export function getFrameForCount(count: number, target = 33): number {
  if (count <= 0) return 1;
  if (count >= target) return TOTAL_FRAMES;
  return Math.round(1 + (count / target) * (TOTAL_FRAMES - 1));
}

// Dynamically tracks Muhammad's exact position across all 239 frames of his journey
// so the rectangle quote popup glides right above him as he cries, walks, runs, and reaches home!
export function getBoyHeadPosition(frame: number): { x: number; y: number } {
  const f = Math.max(1, Math.min(TOTAL_FRAMES, frame));

  if (f <= 70) {
    // Stage 1: Crying by the roadside mosque on the left (x: ~33%, head top: ~34%)
    const p = (f - 1) / 69;
    return {
      x: 33 + p * 0.8,
      y: 31.5 - p * 0.5,
    };
  } else if (f <= 120) {
    // Stage 2: Looking up at the guiding bee (x: ~34% -> 35%, head top: ~34%)
    const p = (f - 70) / 50;
    return {
      x: 33.8 + p * 1.2,
      y: 31.0 + p * 0.5,
    };
  } else if (f <= 170) {
    // Stage 3: Running along the path towards the house (x: ~35% -> 43%, head top: ~38%)
    const p = (f - 120) / 50;
    return {
      x: 35.0 + p * 8.0,
      y: 31.5 + p * 5.5,
    };
  } else if (f <= 195) {
    // Stage 4: Reaching the courtyard steps (x: ~43% -> 49%, head top: ~36%)
    const p = (f - 170) / 25;
    return {
      x: 43.0 + p * 6.0,
      y: 37.0 - p * 2.0,
    };
  } else if (f <= 208) {
    // Stage 5: Approaching home doorstep (x: ~49% -> 54%, head top: ~32%)
    const p = (f - 195) / 13;
    return {
      x: 49.0 + p * 5.0,
      y: 35.0 - p * 5.0,
    };
  } else {
    // Stage 6: Joyfully jumping at home (frames 209-239) - gentle celebratory jump bob
    const jumpCycle = ((f - 209) % 30) / 30;
    const jumpOffset = Math.sin(jumpCycle * Math.PI * 2) * 2.5;
    return {
      x: 54.0,
      y: 29.5 + jumpOffset,
    };
  }
}

export function BoyJourneyAnimation({ currentCount, targetCount = 33 }: BoyJourneyAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const animFrameRef = useRef<number | null>(null);

  const targetFrame = getFrameForCount(currentCount, targetCount);
  const [displayedFrame, setDisplayedFrame] = useState<number>(targetFrame);
  const [isLoaded, setIsLoaded] = useState(false);

  const isCompleted = currentCount >= targetCount;

  // Ultra-crisp high-DPI canvas drawing with mathematically perfect aspect-ratio preservation
  const drawFrame = useCallback((frameNum: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Synchronize canvas internal buffer resolution to physical device pixels
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = container.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const img = imageCache.current.get(frameNum);
    if (img && img.complete && img.naturalWidth > 0) {
      // Highest quality bicubic smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate pixel-perfect object-fit cover math to eliminate distortion and blur
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const scale = Math.max(canvasW / imgW, canvasH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (canvasW - drawW) / 2;
      const drawY = (canvasH - drawH) / 2;

      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  }, []);

  // Preload an individual frame into memory cache
  const preloadFrame = useCallback((frameNum: number): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      if (imageCache.current.has(frameNum)) {
        resolve(imageCache.current.get(frameNum)!);
        return;
      }
      const img = new Image();
      img.src = getFramePath(frameNum);
      img.onload = () => {
        imageCache.current.set(frameNum, img);
        resolve(img);
      };
      img.onerror = () => {
        resolve(img);
      };
    });
  }, []);

  // Handle container resize & split ratio changes with instant re-render at native sharpness
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      drawFrame(displayedFrame);
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [displayedFrame, drawFrame]);

  // Initial load: Preload keyframes immediately, then stream background frames
  useEffect(() => {
    let isMounted = true;

    async function initFrames() {
      // 1. Immediately load frame 1, target frame, and end frame
      const immediate = [1, targetFrame, TOTAL_FRAMES];
      await Promise.all(immediate.map((f) => preloadFrame(f)));

      if (isMounted) {
        setIsLoaded(true);
        drawFrame(targetFrame);
      }

      // 2. Stream remaining frames in background batches
      for (let i = 1; i <= TOTAL_FRAMES; i += 2) {
        if (!isMounted) break;
        preloadFrame(i);
        if (i % 20 === 0) {
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      for (let i = 2; i <= TOTAL_FRAMES; i += 2) {
        if (!isMounted) break;
        preloadFrame(i);
        if (i % 20 === 0) {
          await new Promise((r) => setTimeout(r, 16));
        }
      }
    }

    initFrames();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [preloadFrame, targetFrame, drawFrame]);

  // Scrub smoothly to target frame ONLY when currentCount changes (completing tasks)
  useEffect(() => {
    const start = displayedFrame;
    const end = targetFrame;
    if (start === end) {
      drawFrame(end);
      return;
    }

    let current = start;
    const step = end > start ? 1 : -1;
    let lastTime = performance.now();
    const frameInterval = 28; // ~35 fps fluid scrubbing transition

    const scrub = (now: number) => {
      if (now - lastTime >= frameInterval) {
        current += step;
        lastTime = now;
        setDisplayedFrame(current);
        preloadFrame(current).then(() => drawFrame(current));
      }

      if ((step > 0 && current < end) || (step < 0 && current > end)) {
        animFrameRef.current = requestAnimationFrame(scrub);
      } else {
        setDisplayedFrame(end);
        drawFrame(end);
      }
    };

    animFrameRef.current = requestAnimationFrame(scrub);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentCount, targetFrame, drawFrame, preloadFrame]);

  // When count is 33/33 (completed): Loop joyful jumping animation at home (frames 200 to 239)
  useEffect(() => {
    if (!isCompleted) return;

    let current = 200;
    let direction = 1;
    let lastTime = performance.now();
    const loopInterval = 45; // ~22 fps smooth celebratory jumping loop

    const joyfulLoop = (now: number) => {
      if (now - lastTime >= loopInterval) {
        current += direction;
        if (current >= TOTAL_FRAMES) {
          direction = -1;
          current = TOTAL_FRAMES - 1;
        } else if (current <= 200) {
          direction = 1;
          current = 201;
        }
        lastTime = now;
        setDisplayedFrame(current);
        preloadFrame(current).then(() => drawFrame(current));
      }
      animFrameRef.current = requestAnimationFrame(joyfulLoop);
    };

    animFrameRef.current = requestAnimationFrame(joyfulLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCompleted, drawFrame, preloadFrame]);

  // Current dynamic position of the rectangle quote bubble tracking Muhammad
  const boyPos = getBoyHeadPosition(displayedFrame);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#14251F] select-none"
    >
      {/* High-Definition Responsive Canvas Buffer with High-DPI physical pixel matching */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover select-none pointer-events-none"
        style={{
          imageRendering: "-webkit-optimize-contrast",
          filter: "contrast(1.05) saturate(1.08) brightness(1.02)",
        }}
      />

      {/* Fallback frame before canvas initializes */}
      {!isLoaded && (
        <img
          src={getFramePath(displayedFrame)}
          alt="Boy Journey"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Top subtle shade under navigation bar */}
      <div
        className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Top-Right Journey HUD Status */}
      <div className="absolute top-3 right-3 sm:right-6 z-20 flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Swalath {currentCount}/33</span>
          <span className="text-white/40">•</span>
          <span className="text-[#E9EDC9]">Frame {displayedFrame}/{TOTAL_FRAMES}</span>
        </div>
      </div>

      {/* =========================================================================
          RECTANGLE QUOTE POPUP ABOVE BOY — GLIDES DYNAMICALLY WITH HIS MOVEMENT
          - Rectangle quote popup with rounded corners and fine emerald border
          - Small text: "please help me to reach home with swalath"
          - Speech bubble pointer tail directed down towards Muhammad's head
          - Moves continuously across all 239 frames tracking Muhammad along his journey
         ========================================================================= */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: `${boyPos.x}%`,
          top: `${boyPos.y}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.32)]">
          {/* Rectangle Quote Card */}
          <div className="relative bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border-2 border-[#176B50]/30 shadow-xl max-w-[260px] sm:max-w-[280px] text-center">
            <p className="text-xs sm:text-[13px] font-extrabold tracking-tight text-[#14251F] leading-snug">
              {currentCount >= targetCount
                ? "“Alhamdulillah! I reached home with joy!” 🏡✨"
                : "“please help me to reach home with swalath”"}
            </p>

            {/* Downward Speech Bubble Tail pointing directly to the boy */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-[#176B50]/30 rotate-45" />
          </div>
        </div>
      </div>

      {/* Celebratory Banner when 33/33 Complete */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-4 sm:inset-x-8 bottom-6 z-30 p-4 rounded-3xl bg-[#344E41]/90 backdrop-blur-xl border border-[#A3B18A]/40 text-[#FAF9F6] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-3xl animate-bounce">🏡</span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#E9EDC9] tracking-tight">
                  ALHAMDULILLAH! REACHED HOME WITH JOY!
                </h3>
                <p className="text-xs text-white/85 font-medium">
                  All 33 Nariath Swalaths completed. Muhammad is jumping with happiness at his doorstep!
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#E9EDC9] text-forest font-bold text-xs shadow-md shrink-0">
              ✨ 33/33 Done
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
