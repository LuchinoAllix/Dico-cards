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
import type { Colors } from "../theme/colors";
import type { FontFamilies } from "../theme/fonts";

function themed(style: StyleProp<TextStyle>, colors: Colors, font?: FontFamilies): StyleProp<TextStyle> {
  const base: TextStyle = { color: colors.text };
  if (!font) return [base, style];

  // Custom fonts have one file per weight: pick the file, and cancel the synthetic weight.
  const flat = StyleSheet.flatten(style) ?? {};
  const bold = flat.fontWeight === "bold" || Number(flat.fontWeight) >= 600;
  const italic = flat.fontStyle === "italic";
  const fontFamily = italic ? font.italic : bold ? font.bold : font.regular;
  return [base, style, { fontFamily, fontWeight: "normal", fontStyle: "normal" }];
}

export function Text({ style, ...props }: TextProps) {
  const { colors, font } = useTheme();
  return <RNText {...props} style={themed(style, colors, font)} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  const { colors, font } = useTheme();
  return (
    <RNTextInput placeholderTextColor={colors.textFaint} {...props} style={themed(style, colors, font)} />
  );
}