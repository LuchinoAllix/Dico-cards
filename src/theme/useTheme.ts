import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useAppearanceStore } from "../state/appearance";
import { darkColors, lightColors, type Colors } from "./colors";
import { getFamilies, getFontScale } from "./fonts";

export function useTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const fontId = useAppearanceStore((s) => s.font);
  const sizeId = useAppearanceStore((s) => s.fontSize);
  return {
    scheme,
    colors: scheme === "dark" ? darkColors : lightColors,
    font: getFamilies(fontId), // undefined = system font
    fontScale: getFontScale(sizeId),
  };
}

// Builds a screen's styles from the current colors, and rebuilds them when the theme changes.
export function useThemedStyles<T>(factory: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}