import { FontAwesome } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

interface GroupProps {
  title: string;
  note?: string;
  options: number[];
  value: number | null;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

function OptionGroup({ title, note, options, value, format, onChange }: GroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.section}>{title}</Text>
      {note && <Text style={styles.note}>{note}</Text>}
      {options.map((option) => (
        <Pressable key={option} style={styles.row} onPress={() => onChange(option)}>
          <Text style={styles.label}>{format(option)}</Text>
          {value === option && <FontAwesome name="check" size={20} color="#2563eb" />}
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
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

      <OptionGroup
        title='Words count as "Recent" for'
        options={RECENT_DAYS_OPTIONS}
        value={recentDays}
        format={(n) => `${n} ${n === 1 ? "day" : "days"}`}
        onChange={(n) => {
          setRecentDaysState(n);
          setRecentDays(n);
        }}
      />

      <OptionGroup
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

      <OptionGroup
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

const styles = StyleSheet.create({
  container: { padding: 16 },
  group: { marginBottom: 28 },
  section: { fontSize: 14, color: "#666", marginBottom: 4, textTransform: "uppercase" },
  note: { fontSize: 13, color: "#888", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  label: { fontSize: 17 },
});