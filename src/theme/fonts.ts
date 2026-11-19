import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_400Regular_Italic,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";

export type FontId = "system" | "inter" | "lora" | "atkinson";

export interface FontFamilies {
  regular: string;
  italic: string;
  bold: string;
}

export const FONT_OPTIONS: { id: FontId; label: string; families?: FontFamilies }[] = [
  { id: "system", label: "System default" },
  {
    id: "inter",
    label: "Inter",
    families: { regular: "Inter_400Regular", italic: "Inter_400Regular_Italic", bold: "Inter_700Bold" },
  },
  {
    id: "lora",
    label: "Lora (serif)",
    families: { regular: "Lora_400Regular", italic: "Lora_400Regular_Italic", bold: "Lora_700Bold" },
  },
  {
    id: "atkinson",
    label: "Atkinson Hyperlegible",
    families: {
      regular: "AtkinsonHyperlegible_400Regular",
      italic: "AtkinsonHyperlegible_400Regular_Italic",
      bold: "AtkinsonHyperlegible_700Bold",
    },
  },
];

// The names here are the family names used above.
export const FONT_ASSETS = {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_700Bold,
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_400Regular_Italic,
  AtkinsonHyperlegible_700Bold,
};

export function getFamilies(id: FontId): FontFamilies | undefined {
  return FONT_OPTIONS.find((f) => f.id === id)?.families;
}

export type FontSizeId = "small" | "default" | "large" | "xlarge";

export const FONT_SIZE_OPTIONS: { id: FontSizeId; label: string; scale: number }[] = [
  { id: "small", label: "Small", scale: 0.9 },
  { id: "default", label: "Default", scale: 1 },
  { id: "large", label: "Large", scale: 1.15 },
  { id: "xlarge", label: "Extra large", scale: 1.3 },
];

export function getFontScale(id: FontSizeId): number {
  return FONT_SIZE_OPTIONS.find((o) => o.id === id)?.scale ?? 1;
}