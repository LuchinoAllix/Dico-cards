import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";
import type { FontFamilies } from "../theme/fonts";

type Theme = ReturnType<typeof useTheme>;

// Custom fonts have one file per weight: pick the file, and cancel the synthetic weight.
function fontOverrides(flat: TextStyle, font: FontFamilies): TextStyle {
  const bold = flat.fontWeight === "bold" || Number(flat.fontWeight) >= 600;
  const italic = flat.fontStyle === "italic";
  return {
    fontFamily: italic ? font.italic : bold ? font.bold : font.regular,
    fontWeight: "normal",
    fontStyle: "normal",
  };
}

function themed(style: StyleProp<TextStyle>, theme: Theme): StyleProp<TextStyle> {
  const { colors, font, fontScale } = theme;
  const flat = StyleSheet.flatten(style) ?? {};

  const overrides: TextStyle = {
    // 14 is React Native's default text size, used when a style doesn't set one.
    fontSize: (flat.fontSize ?? 14) * fontScale,
    ...(flat.lineHeight ? { lineHeight: flat.lineHeight * fontScale } : {}),
    ...(font ? fontOverrides(flat, font) : {}),
  };

  return [{ color: colors.text }, style, overrides];
}

export function Text({ style, ...props }: TextProps) {
  const theme = useTheme();
  return <RNText {...props} style={themed(style, theme)} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <RNTextInput placeholderTextColor={theme.colors.textFaint} {...props} style={themed(style, theme)} />
  );
}