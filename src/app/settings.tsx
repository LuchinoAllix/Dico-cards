import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Text } from "../components/Text";
import {
  RECENT_DAYS_OPTIONS,
  RETENTION_OPTIONS,
  SESSION_SIZE_OPTIONS,
  getRecentDays,
  getRetention,
  getSessionSize,
  setRecentDays,
  setRetention,
  setSessionSize,
} from "../db/settings";
import { FONT_OPTIONS, type FontId } from "../theme/fonts";
import { useAppearanceStore, type ThemePreference } from "../state/appearance";
import { useTheme, useThemedStyles } from "../theme/useTheme";
import type { Colors } from "../theme/colors";

interface GroupProps<T extends string | number> {
  title: string;
  note?: string;
  options: T[];
  value: T | null;
  format: (value: T) => string;
  onChange: (value: T) => void;
}

function OptionGroup<T extends string | number>({
  title,
  note,
  options,
  value,
  format,
  onChange,
}: GroupProps<T>) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.group}>
      <Text style={styles.section}>{title}</Text>
      {note && <Text style={styles.note}>{note}</Text>}
      {options.map((option) => (
        <Pressable key={option} style={styles.row} onPress={() => onChange(option)}>
          <Text style={styles.label}>{format(option)}</Text>
          {value === option && <FontAwesome name="check" size={20} color={colors.primary} />}
        </Pressable>
      ))}
    </View>
  );
}

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Follow the phone",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useAppearanceStore((s) => s.theme);
  const setTheme = useAppearanceStore((s) => s.setTheme);
  const font = useAppearanceStore((s) => s.font);
  const setFont = useAppearanceStore((s) => s.setFont);

  const [recentDays, setRecentDaysState] = useState<number | null>(null);
  const [retention, setRetentionState] = useState<number | null>(null);
  const [sessionSize, setSessionSizeState] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getRecentDays(), getRetention(), getSessionSize()]).then(([d, r, s]) => {
      setRecentDaysState(d);
      setRetentionState(r);
      setSessionSizeState(s);
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />

      <OptionGroup<ThemePreference>
        title="Theme"
        options={["system", "light", "dark"]}
        value={theme}
        format={(t) => THEME_LABELS[t]}
        onChange={setTheme}
      />

      <View>
        <OptionGroup<FontId>
          title="Font"
          options={FONT_OPTIONS.map((f) => f.id)}
          value={font}
          format={(id) => FONT_OPTIONS.find((f) => f.id === id)?.label ?? id}
          onChange={setFont}
        />
      </View>

      <OptionGroup<number>
        title='Words count as "Recent" for'
        options={RECENT_DAYS_OPTIONS}
        value={recentDays}
        format={(n) => `${n} ${n === 1 ? "day" : "days"}`}
        onChange={(n) => {
          setRecentDaysState(n);
          setRecentDays(n);
        }}
      />

      <OptionGroup<number>
        title="Target retention"
        note="Higher means you remember more, but words come back more often. 90% is the standard."
        options={RETENTION_OPTIONS}
        value={retention}
        format={(n) => `${Math.round(n * 100)}%`}
        onChange={(n) => {
          setRetentionState(n);
          setRetention(n);
        }}
      />

      <OptionGroup<number>
        title="Words per study session"
        options={SESSION_SIZE_OPTIONS}
        value={sessionSize}
        format={(n) => `${n} words`}
        onChange={(n) => {
          setSessionSizeState(n);
          setSessionSize(n);
        }}
      />
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { padding: 16 },
    group: { marginBottom: 28 },
    section: { fontSize: 14, color: c.textMuted, marginBottom: 4, textTransform: "uppercase" },
    note: { fontSize: 13, color: c.textFaint, marginBottom: 8 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    label: { fontSize: 17 },
    preview: { fontSize: 18, marginTop: -12, marginBottom: 28 },
  });