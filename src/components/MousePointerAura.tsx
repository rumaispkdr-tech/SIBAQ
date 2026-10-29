"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeContext";

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
}

export function MousePointerAura() {
  const { preferences } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const mousePos = useRef({ x: -100, y: -100 });
  const auraPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    setMounted(true);
    // Check if device supports fine pointer (mouse/trackpad, not touch-only)
    const isFine = window.matchMedia("(pointer: fine)").matches;
    setIsPointerDevice(isFine);

    if (!isFine) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Check if hovering over clickable or interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest("button, a, input, select, textarea, [role='button']");
        setIsHovering(Boolean(interactive));
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (preferences.animation_mode === "off") return;
      // Spawn 6 tiny translucent sparkles on click
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 3 + 2,
          alpha: 0.8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    };

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("resize", handleResize);

    // Smooth RAF loop for fluid lerp physics and click particles
    const loop = () => {
      // Linear interpolation (lerp) for smooth trailing aura
      auraPos.current.x += (mousePos.current.x - auraPos.current.x) * 0.18;
      auraPos.current.y += (mousePos.current.y - auraPos.current.y) * 0.18;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Draw glowing organic halo at cursor position
          if (mousePos.current.x > 0 && mousePos.current.y > 0) {
            const radius = isHovering ? 28 : 16;
            const gradient = ctx.createRadialGradient(
              auraPos.current.x,
              auraPos.current.y,
              0,
              auraPos.current.x,
              auraPos.current.y,
              radius
            );
            gradient.addColorStop(0, "rgba(163, 177, 138, 0.45)"); // soft sage
            gradient.addColorStop(0.5, "rgba(233, 237, 201, 0.25)"); // pale lime
            gradient.addColorStop(1, "rgba(163, 177, 138, 0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(auraPos.current.x, auraPos.current.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Tiny center core dot
            ctx.fillStyle = "rgba(52, 78, 65, 0.55)";
            ctx.beginPath();
            ctx.arc(auraPos.current.x, auraPos.current.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // 2. Update and render click particles
          for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;

            if (p.alpha <= 0) {
              particles.current.splice(i, 1);
              continue;
            }

            ctx.fillStyle = `rgba(163, 177, 138, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isHovering, preferences.animation_mode]);

  if (!mounted || !isPointerDevice || preferences.animation_mode === "off") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    />
  );
}
