"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CandidateSafe } from "@/lib/types";
import {
  Sparkles,
  LogOut,
  Settings,
  ShieldAlert,
  Calendar,
  Compass,
} from "lucide-react";
import { formatKolkataDateTime } from "@/lib/timezone";

interface NavbarProps {
  user: CandidateSafe;
  onOpenSettings: () => void;
  onOpenPeacefulPause: () => void;
  onTriggerFireworks: () => void;
}

export function Navbar({
  user,
  onOpenSettings,
  onOpenPeacefulPause,
  onTriggerFireworks,
}: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/75 border-b border-[#A3B18A]/20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Greeting */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md shadow-forest/10 border border-[#A3B18A]/30 overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Swalath Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold text-forest tracking-tight leading-tight">
                SIBAQ NARIATH SWALATH
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-forest/75 font-medium">
                <span className="font-semibold text-forest">{user.name}</span>
                <span className="text-[#A3B18A]">•</span>
                <span className="bg-[#E9EDC9]/70 border border-[#A3B18A]/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-forest">
                  {user.admission_no}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Release Some Calm Button */}
          <button
            onClick={onTriggerFireworks}
            title="Launch peaceful emoji fireworks"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9EDC9]/75 border border-[#A3B18A]/40 text-forest font-semibold text-xs shadow-sm hover:bg-[#E9EDC9] hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#344E41]" />
            <span>✨ Release Some Calm</span>
          </button>

          {/* Peaceful Pause Quick Button */}
          <button
            onClick={onOpenPeacefulPause}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#A3B18A]/30 text-forest font-semibold text-xs shadow-sm hover:bg-[#FAF9F6] active:scale-95 transition-all"
          >
            <span>🌿</span>
            <span className="hidden md:inline">Peaceful Pause</span>
          </button>

          {/* Admin Switcher */}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E9EDC9]/80 border border-[#A3B18A]/40 text-forest font-bold text-xs hover:bg-[#E9EDC9] transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-forest" />
              <span className="hidden md:inline">Admin Portal</span>
            </Link>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-forest hover:bg-[#E9EDC9]/40 transition-colors"
            aria-label="Settings"
            title="Settings & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
