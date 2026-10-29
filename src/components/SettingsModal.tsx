"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeContext";
import { ThemeName, TextSize, AnimationMode } from "@/lib/types";
import {
  X,
  Palette,
  Type,
  Activity,
  Sparkles,
  Volume2,
  Eye,
  KeyRound,
  Check,
  AlertCircle,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  admissionNo?: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  candidateName,
  admissionNo,
}: SettingsModalProps) {
  const {
    preferences,
    setTheme,
    setTextSize,
    setAnimationMode,
    setFireworksEnabled,
    setAmbientMotion,
    setSoundEnabled,
    setEyeRestEnabled,
  } = useTheme();

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!isOpen) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password.");
      } else {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordSection(false), 2000);
      }
    } catch {
      setPasswordError("Network error while updating password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg oneui-card-elevated p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/10">
            <div>
              <h3 className="text-xl font-bold text-forest">Preferences &amp; Settings</h3>
              {candidateName && (
                <p className="text-xs text-emerald-700">
                  {candidateName} ({admissionNo})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-emerald-100/60 text-emerald-800 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 pt-5">
            {/* 1. Theme Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                Theme &amp; Atmosphere
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "peaceful-garden", label: "Peaceful Garden" },
                  { id: "morning-mist", label: "Morning Mist" },
                  { id: "soft-sky", label: "Soft Sky" },
                  { id: "warm-evening", label: "Warm Evening" },
                  { id: "minimal-ivory", label: "Minimal Ivory" },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id as ThemeName)}
                    className={`p-2.5 text-xs font-medium rounded-xl border text-left transition-all ${
                      preferences.theme === th.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/30"
                        : "border-gray-200 bg-white/70 hover:bg-emerald-50/40 text-gray-700"
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Text Size */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2.5">
                <Type className="w-4 h-4 text-emerald-600" />
                Arabic Dhikr Font Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", label: "Standard" },
                  { id: "large", label: "Large" },
                  { id: "extra-large", label: "Extra Large" },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setTextSize(sz.id as TextSize)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      preferences.text_size === sz.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/30"
                        : "border-gray-200 bg-white/70 hover:bg-emerald-50/40 text-gray-700"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Motion & Animations */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Motion Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "full", label: "Full Motion" },
                  { id: "reduced", label: "Reduced" },
                  { id: "off", label: "Off" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAnimationMode(m.id as AnimationMode)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      preferences.animation_mode === m.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/30"
                        : "border-gray-200 bg-white/70 hover:bg-emerald-50/40 text-gray-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Toggles */}
            <div className="space-y-3 pt-2 border-t border-emerald-500/10">
              <label className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-emerald-500/10 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-forest block">
                      Emoji Fireworks
                    </span>
                    <span className="text-[11px] text-emerald-700/70">
                      Show calm bursts on trigger &amp; completion
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.fireworks_enabled}
                  onChange={(e) => setFireworksEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-emerald-500/10 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🍃</span>
                  <div>
                    <span className="text-xs font-semibold text-forest block">
                      Floating Garden Particles
                    </span>
                    <span className="text-[11px] text-emerald-700/70">
                      Gentle drifting leaves in the background
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.ambient_motion}
                  onChange={(e) => setAmbientMotion(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-emerald-500/10 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-forest block">
                      Eye-Rest Reminders
                    </span>
                    <span className="text-[11px] text-emerald-700/70">
                      Show gentle 20-20-20 visual pauses
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.eye_rest_enabled}
                  onChange={(e) => setEyeRestEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>
            </div>

            {/* 5. Password Change Dropdown */}
            <div className="pt-2 border-t border-emerald-500/10">
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/20 bg-white/70 hover:bg-emerald-50/50 text-emerald-800 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Change Account Password
                </span>
                <span>{showPasswordSection ? "▲" : "▼"}</span>
              </button>

              {showPasswordSection && (
                <form onSubmit={handlePasswordChange} className="mt-3 p-4 rounded-2xl bg-white/80 border border-emerald-500/20 space-y-3">
                  {passwordError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5 border border-rose-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1.5 border border-emerald-200">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                      New Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow disabled:opacity-60"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
