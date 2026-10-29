"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTheme } from "./ThemeContext";

const FIREWORK_EMOJIS = [
  "🌿", "🍃", "🌸", "🌼", "✨", "⭐", "🦋",
  "🫧", "💚", "🌱", "🌷", "💫", "🕊️", "🌾", "🐝"
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  baseScale: number;
  scale: number;
  emoji: string;
  alpha: number;
  age: number; // in milliseconds
  maxDuration: number; // in milliseconds
}

// Global firework trigger dispatcher for instant, delay-free triggering
export function triggerEmojiFireworks() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sibaq:trigger-fireworks"));
  }
}

// Global offscreen sprite cache across renders so each emoji is rasterized exactly ONCE
// Replacing heavy ctx.fillText with GPU hardware-accelerated ctx.drawImage eliminates all lag!
const spriteCache = new Map<string, HTMLCanvasElement>();

function getEmojiSprite(emoji: string, dpr: number): HTMLCanvasElement {
  const roundedDpr = Math.min(2, Math.max(1, Math.round(dpr * 10) / 10));
  const key = `${emoji}@${roundedDpr}`;
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const basePx = 52;
  const size = Math.round(basePx * roundedDpr);
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const fontSize = Math.round(size * 0.74);
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, size / 2, size / 2);
  }
  spriteCache.set(key, offscreen);
  return offscreen;
}

export function EmojiFireworks({ triggerRef }: { triggerRef?: React.MutableRefObject<(() => void) | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const { preferences } = useTheme();

  // Resize canvas cleanly with DPR compensation
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-warm the emoji sprite cache on mount so first click has ZERO hitch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      FIREWORK_EMOJIS.forEach((e) => getEmojiSprite(e, dpr));
    }
  }, []);

  // Launch immediate firework burst (zero artificial delay, smooth physics)
  const spawnBurst = useCallback((originX: number, originY: number, count = 32) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentCount = particlesRef.current.length;
    // Cap active particles to 120 max to guarantee 60-120fps locked performance
    if (currentCount >= 120) return;
    const allowed = Math.min(count, 120 - currentCount);

    for (let i = 0; i < allowed; i++) {
      // Fan out upward in a natural dome (-160 deg to -20 deg)
      const angle = (-(Math.random() * 140 + 20) * Math.PI) / 180;
      const speed = Math.random() * 10 + 8.5;
      const emoji = FIREWORK_EMOJIS[Math.floor(Math.random() * FIREWORK_EMOJIS.length)];
      const maxDuration = Math.random() * 600 + 1400; // 1.4s - 2.0s smooth flight

      particlesRef.current.push({
        x: originX + (Math.random() * 50 - 25),
        y: originY + (Math.random() * 20 - 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 4.5,
        baseScale: Math.random() * 0.3 + 0.75,
        scale: 0.1,
        emoji,
        alpha: 0,
        age: 0,
        maxDuration,
      });
    }
  }, []);

  // Single animation loop optimized for 60-120fps with delta time & in-place pooling
  const runLoop = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const deltaMs = Math.min(now - (lastTimeRef.current || now), 34);
    lastTimeRef.current = now;
    const dt = deltaMs / 16.67; // normalized delta time (1.0 = 60fps)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    let writeIdx = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.age += deltaMs;

      if (p.age >= p.maxDuration) {
        continue; // Particle reached end of life
      }

      const progress = p.age / p.maxDuration; // 0.0 to 1.0

      // Ultra-smooth non-linear alpha & scale transition:
      // First 12% duration: smooth sine fade-in from 0 to 1 (no pop-in flash)
      // Middle duration: full 1.0 opacity drifting gently
      // Last 45% duration: cubic ease-out fade to 0 + soft dissipation shrink
      if (progress < 0.12) {
        const inProgress = progress / 0.12;
        p.alpha = Math.sin(inProgress * (Math.PI / 2));
        p.scale = p.baseScale * (0.6 + 0.4 * inProgress);
      } else if (progress > 0.55) {
        const fadeProgress = (progress - 0.55) / 0.45;
        p.alpha = Math.max(0, 1 - Math.pow(fadeProgress, 2.2));
        p.scale = p.baseScale * (1 - 0.22 * fadeProgress);
      } else {
        p.alpha = 1;
        p.scale = p.baseScale;
      }

      // Physics integration with delta time
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.32 * dt; // natural gentle gravity
      p.vx *= Math.pow(0.985, dt); // air resistance
      p.rotation += p.vRot * dt;

      if (p.alpha > 0.01 && p.y < window.innerHeight + 80) {
        const sprite = getEmojiSprite(p.emoji, dpr);
        const spriteRenderWidth = (sprite.width / dpr) * p.scale;
        const spriteRenderHeight = (sprite.height / dpr) * p.scale;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x * dpr, p.y * dpr);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.drawImage(
          sprite,
          (-spriteRenderWidth / 2) * dpr,
          (-spriteRenderHeight / 2) * dpr,
          spriteRenderWidth * dpr,
          spriteRenderHeight * dpr
        );
        ctx.restore();

        particles[writeIdx++] = p;
      }
    }

    // In-place truncation — zero garbage collection pauses
    particles.length = writeIdx;

    if (writeIdx > 0) {
      animFrameIdRef.current = requestAnimationFrame(runLoop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      isRunningRef.current = false;
    }
  }, []);

  const triggerFireworks = useCallback(() => {
    if (!preferences.fireworks_enabled || preferences.animation_mode === "off") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const originX = window.innerWidth * 0.5;
    const originY = window.innerHeight * 0.82;

    // Instant triple fountain launch with zero hitch
    spawnBurst(originX, originY, 32);
    spawnBurst(originX - 160, originY + 15, 20);
    spawnBurst(originX + 160, originY + 15, 20);

    if (!isRunningRef.current) {
      isRunningRef.current = true;
      lastTimeRef.current = performance.now();
      animFrameIdRef.current = requestAnimationFrame(runLoop);
    }
  }, [preferences.fireworks_enabled, preferences.animation_mode, spawnBurst, runLoop]);

  // Hook up external triggers & custom event
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = triggerFireworks;
    }

    const handleCustomTrigger = () => triggerFireworks();
    window.addEventListener("sibaq:trigger-fireworks", handleCustomTrigger);
    return () => {
      window.removeEventListener("sibaq:trigger-fireworks", handleCustomTrigger);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [triggerFireworks, triggerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
      aria-hidden="true"
    />
  );
}
