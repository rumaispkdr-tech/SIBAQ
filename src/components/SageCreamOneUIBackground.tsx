"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "./ThemeContext";

interface Particle {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  opacity: number;
  color: string;
}

export function SageCreamOneUIBackground() {
  const { preferences, isPauseMode } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  const shouldAnimate =
    preferences.ambient_motion &&
    preferences.animation_mode !== "off" &&
    !isPauseMode;

  // Lightweight scroll-responsive parallax tracking (throttled with RAF)
  useEffect(() => {
    if (!shouldAnimate) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY || window.pageYOffset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldAnimate]);

  // Understated, sparse, soft translucent particles (dots)
  const particles: Particle[] = useMemo(() => {
    // 14 dots on desktop, 8 on smaller screens
    const colors = [
      "rgba(163, 177, 138, 0.45)", // soft sage
      "rgba(233, 237, 201, 0.55)", // pale lime
      "rgba(255, 255, 255, 0.65)", // soft white
      "rgba(52, 78, 65, 0.25)",    // muted forest
    ];

    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: (i * 7.1 + 3) % 94,
      y: (i * 9.3 + 6) % 90,
      size: (i % 3) + 3.5, // 3.5px to 5.5px
      duration: 16 + (i % 5) * 2, // 16s to 24s
      delay: (i % 4) * 1.5,
      opacity: 0.25 + (i % 3) * 0.15,
      color: colors[i % colors.length],
    }));
  }, []);

  // Subtle parallax offsets
  const parallax1 = shouldAnimate ? scrollY * 0.05 : 0;
  const parallax2 = shouldAnimate ? scrollY * -0.04 : 0;
  const parallax3 = shouldAnimate ? scrollY * 0.03 : 0;
  const parallax4 = shouldAnimate ? scrollY * -0.02 : 0;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none"
      aria-hidden="true"
    >
      {/* =========================================================================
          LAYER A: 4–5 OVERSIZED, SOFTLY BLURRED ORGANIC GRADIENT ORBS
          Diffused Samsung One UI ambient curves with no harsh banding
         ========================================================================= */}

      {/* Orb 1: Soft Sage Ambient Glow (Hero / Top-Center) */}
      <div
        className={`absolute rounded-full transition-transform will-change-transform ${
          shouldAnimate ? "animate-orb-1" : ""
        }`}
        style={{
          width: "clamp(340px, 45vw, 620px)",
          height: "clamp(340px, 45vw, 620px)",
          top: "-10%",
          left: "15%",
          background: "radial-gradient(circle, rgba(163, 177, 138, 0.28) 0%, rgba(163, 177, 138, 0.08) 60%, transparent 80%)",
          filter: "blur(100px)",
          transform: `translate3d(0, ${parallax1}px, 0)`,
        }}
      />

      {/* Orb 2: Pale Lime Ambient Accent (Top-Right Corner) */}
      <div
        className={`absolute rounded-full transition-transform will-change-transform ${
          shouldAnimate ? "animate-orb-2" : ""
        }`}
        style={{
          width: "clamp(320px, 40vw, 560px)",
          height: "clamp(320px, 40vw, 560px)",
          top: "4%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(233, 237, 201, 0.50) 0%, rgba(233, 237, 201, 0.15) 55%, transparent 75%)",
          filter: "blur(110px)",
          transform: `translate3d(0, ${parallax2}px, 0)`,
        }}
      />

      {/* Orb 3: Luminous Warm Cream / Translucent White (Center Horizon) */}
      <div
        className={`absolute rounded-full transition-transform will-change-transform ${
          shouldAnimate ? "animate-orb-3" : ""
        }`}
        style={{
          width: "clamp(380px, 50vw, 700px)",
          height: "clamp(380px, 50vw, 700px)",
          top: "35%",
          left: "-12%",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.75) 0%, rgba(250, 249, 246, 0.35) 60%, transparent 80%)",
          filter: "blur(120px)",
          transform: `translate3d(0, ${parallax3}px, 0)`,
        }}
      />

      {/* Orb 4: Soft Sage Depth Glow (Mid-Lower Center) */}
      <div
        className={`absolute rounded-full transition-transform will-change-transform ${
          shouldAnimate ? "animate-orb-4" : ""
        }`}
        style={{
          width: "clamp(360px, 46vw, 640px)",
          height: "clamp(360px, 46vw, 640px)",
          top: "55%",
          right: "10%",
          background: "radial-gradient(circle, rgba(163, 177, 138, 0.22) 0%, rgba(233, 237, 201, 0.12) 55%, transparent 75%)",
          filter: "blur(115px)",
          transform: `translate3d(0, ${parallax4}px, 0)`,
        }}
      />

      {/* Orb 5: Forest & Pale Lime Base Atmosphere (Bottom Canvas) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "clamp(400px, 55vw, 750px)",
          height: "clamp(400px, 55vw, 750px)",
          bottom: "-15%",
          left: "20%",
          background: "radial-gradient(circle, rgba(233, 237, 201, 0.35) 0%, rgba(163, 177, 138, 0.12) 50%, transparent 75%)",
          filter: "blur(130px)",
        }}
      />

      {/* =========================================================================
          LAYER B: SPARSE, UNDERSTATED FLOATING TRANSLUCENT PARTICLES (DOTS)
          Gentle vertical and horizontal drift, clean & non-distracting
         ========================================================================= */}
      {shouldAnimate &&
        particles.map((p, idx) => (
          <div
            key={p.id}
            className={`absolute rounded-full ${
              idx % 2 === 0 ? "animate-particle-drift" : "animate-particle-drift-slow"
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              willChange: "transform, opacity",
            }}
          />
        ))}
    </div>
  );
}
