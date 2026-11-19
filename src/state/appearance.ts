import { Appearance } from "react-native";
import { create } from "zustand";
import Storage from "expo-sqlite/kv-store";
import { FONT_OPTIONS, FONT_SIZE_OPTIONS, type FontId, type FontSizeId } from "../theme/fonts";

export type ThemePreference = "system" | "light" | "dark";
const THEMES: ThemePreference[] = ["system", "light", "dark"];

function applyTheme(pref: ThemePreference) {
  // Not every environment has this function (for example the web version
  // used when the build renders pages in Node), so check before calling it.
  if (typeof Appearance.setColorScheme !== "function") return;
  Appearance.setColorScheme(pref === "system" ? "auto" : pref);
}

function initialTheme(): ThemePreference {
  const stored = Storage.getItemSync("theme") as ThemePreference | null;
  return stored && THEMES.includes(stored) ? stored : "system";
}

function initialFont(): FontId {
  const stored = Storage.getItemSync("font");
  return FONT_OPTIONS.find((f) => f.id === stored)?.id ?? "system";
}

function initialFontSize(): FontSizeId {
  const stored = Storage.getItemSync("fontSize");
  return FONT_SIZE_OPTIONS.find((o) => o.id === stored)?.id ?? "default";
}

const startTheme = initialTheme();
applyTheme(startTheme); // runs once, when the app starts

interface AppearanceState {
  theme: ThemePreference;
  font: FontId;
  fontSize: FontSizeId;
  setTheme: (theme: ThemePreference) => void;
  setFont: (font: FontId) => void;
  setFontSize: (size: FontSizeId) => void;
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  theme: startTheme,
  font: initialFont(),
  fontSize: initialFontSize(),
  setTheme: (theme) => {
    Storage.setItemSync("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  setFont: (font) => {
    Storage.setItemSync("font", font);
    set({ font });
  },
  setFontSize: (fontSize) => {
    Storage.setItemSync("fontSize", fontSize);
    set({ fontSize });
  },
}));