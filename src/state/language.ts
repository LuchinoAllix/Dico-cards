import { create } from "zustand";
import Storage from "expo-sqlite/kv-store";
import { DEFAULT_LANGUAGE, DICTIONARIES } from "../db/dictionaries";

function initialLanguage(): string {
  const stored = Storage.getItemSync("language");
  return DICTIONARIES.find((d) => d.code === stored)?.code ?? DEFAULT_LANGUAGE;
}

interface LanguageState {
  language: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLanguage(),
  setLanguage: (code) => {
    Storage.setItemSync("language", code);
    set({ language: code });
  },
}));