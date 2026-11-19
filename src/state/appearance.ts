import { Appearance } from "react-native";
import { create } from "zustand";
import Storage from "expo-sqlite/kv-store";
import { FONT_OPTIONS, type FontId } from "../theme/fonts";

export type ThemePreference = "system" | "light" | "dark";
const THEMES: ThemePreference[] = ["system", "light", "dark"];

// null gives control back to the phone's setting.
function applyTheme(pref: ThemePreference) {
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

const startTheme = initialTheme();
applyTheme(startTheme); // runs once, when the app starts

interface AppearanceState {
  theme: ThemePreference;
  font: FontId;
  setTheme: (theme: ThemePreference) => void;
  setFont: (font: FontId) => void;
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  theme: startTheme,
  font: initialFont(),
  setTheme: (theme) => {
    Storage.setItemSync("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  setFont: (font) => {
    Storage.setItemSync("font", font);
    set({ font });
  },
}));