"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FloatingGardenBackground } from "@/components/FloatingGardenBackground";
import { MousePointerAura } from "@/components/MousePointerAura";
import { ThemeProvider } from "@/components/ThemeContext";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [admissionNo, setAdmissionNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!admissionNo.trim() || !password) {
      setError("Please provide both your admission number and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission_no: admissionNo.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please verify credentials.");
        setIsLoading(false);
      } else {
        // Immediate clean navigation ensures cookie transmission to server
        if (data.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      }
    } catch {
      setError("Network or server connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <main className="min-h-screen relative flex flex-col items-center justify-center p-4 selection:bg-oneui-lime/50">
        <FloatingGardenBackground />
        <MousePointerAura />

        <div className="w-full max-w-md relative z-10">
          {/* Gentle rising entrance animation for login card (500-800ms) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative oneui-card-elevated p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            {/* Large soft sage gradient glow behind main heading */}
            <div
              className="absolute -top-10 left-1/4 w-64 h-36 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(163, 177, 138, 0.32) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              aria-hidden="true"
            />
            {/* Pale lime ambient glow toward corner */}
            <div
              className="absolute -top-6 -right-6 w-48 h-36 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(233, 237, 201, 0.60) 0%, transparent 70%)",
                filter: "blur(35px)",
              }}
              aria-hidden="true"
            />

            {/* Official Brand Logo on Login Page Popup */}
            <div className="relative z-10 flex flex-col items-center text-center mb-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative mb-4 group"
              >
                {/* Soft Emerald Glow Behind Logo */}
                <div className="absolute inset-0 rounded-3xl bg-[#176B50]/35 blur-xl group-hover:bg-[#176B50]/55 transition-all duration-300" />
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white/95 p-3.5 shadow-2xl ring-2 ring-[#A3B18A]/35 backdrop-blur-md flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Sibaq Nariath Swalath Official Logo"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl md:text-3xl font-extrabold text-forest tracking-tight"
              >
                SIBAQ NARIATH SWALATH
              </motion.h1>

              {/* Exact welcome message requested in Prompt with staggered reveal */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4 p-4 rounded-2xl bg-white/75 border border-[#A3B18A]/25 text-left shadow-sm backdrop-blur-sm"
              >
                <h2 className="text-base font-bold text-forest flex items-center gap-1.5 mb-1">
                  <span>Assalamu Alaikum! 🌿</span>
                </h2>
                <p className="text-xs text-forest/80 font-medium leading-relaxed">
                  Welcome to your Sibaq daily dhikr space. Take a peaceful moment and begin whenever you are ready.
                </p>
              </motion.div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admission_no"
                  className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5"
                >
                  Admission Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700/60">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admission_no"
                    type="text"
                    required
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                    placeholder="Enter admission number"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-emerald-900/15 bg-white/90 text-sm font-medium text-forest placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700/60">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 rounded-2xl border border-emerald-900/15 bg-white/90 text-sm font-medium text-forest placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-700/60 hover:text-emerald-900 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Powered by Rumais */}
                <div className="mt-2 text-center">
                  <span className="text-[12px] font-semibold text-forest/70 tracking-wide font-sans">
                    powered by Rumais
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Entering Digital Garden...</span>
                  </span>
                ) : (
                  <>
                    <span>Enter Swalath Space</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </main>
    </ThemeProvider>
  );
}
