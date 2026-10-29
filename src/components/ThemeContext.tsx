"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeName, TextSize, AnimationMode, UserPreferences } from "@/lib/types";

interface ThemeContextType {
  preferences: UserPreferences;
  setTheme: (theme: ThemeName) => void;
  setTextSize: (size: TextSize) => void;
  setAnimationMode: (mode: AnimationMode) => void;
  setFireworksEnabled: (enabled: boolean) => void;
  setAmbientMotion: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setEyeRestEnabled: (enabled: boolean) => void;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  isPauseMode: boolean;
  setIsPauseMode: (val: boolean) => void;
}

const defaultPreferences: UserPreferences = {
  candidate_id: "",
  theme: "peaceful-garden",
  text_size: "large",
  animation_mode: "full",
  fireworks_enabled: true,
  ambient_motion: true,
  sound_enabled: false,
  eye_rest_enabled: true,
};

const ThemeContext = createContext<ThemeContextType>({
  preferences: defaultPreferences,
  setTheme: () => {},
  setTextSize: () => {},
  setAnimationMode: () => {},
  setFireworksEnabled: () => {},
  setAmbientMotion: () => {},
  setSoundEnabled: () => {},
  setEyeRestEnabled: () => {},
  updatePreferences: async () => {},
  isPauseMode: false,
  setIsPauseMode: () => {},
});

export function ThemeProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences?: UserPreferences;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || defaultPreferences
  );
  const [isPauseMode, setIsPauseMode] = useState(false);

  // Apply theme to document body
  useEffect(() => {
    document.body.setAttribute("data-theme", preferences.theme);
  }, [preferences.theme]);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches && preferences.animation_mode === "full") {
      setPreferences((prev) => ({ ...prev, animation_mode: "reduced" }));
    }
  }, []);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
    } catch (err) {
      console.warn("Failed to save preferences to server:", err);
    }
  };

  const setTheme = (theme: ThemeName) => updatePreferences({ theme });
  const setTextSize = (text_size: TextSize) => updatePreferences({ text_size });
  const setAnimationMode = (animation_mode: AnimationMode) => updatePreferences({ animation_mode });
  const setFireworksEnabled = (fireworks_enabled: boolean) => updatePreferences({ fireworks_enabled });
  const setAmbientMotion = (ambient_motion: boolean) => updatePreferences({ ambient_motion });
  const setSoundEnabled = (sound_enabled: boolean) => updatePreferences({ sound_enabled });
  const setEyeRestEnabled = (eye_rest_enabled: boolean) => updatePreferences({ eye_rest_enabled });

  return (
    <ThemeContext.Provider
      value={{
        preferences,
        setTheme,
        setTextSize,
        setAnimationMode,
        setFireworksEnabled,
        setAmbientMotion,
        setSoundEnabled,
        setEyeRestEnabled,
        updatePreferences,
        isPauseMode,
        setIsPauseMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
