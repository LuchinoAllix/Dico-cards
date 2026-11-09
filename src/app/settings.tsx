import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { getRecentDays, setRecentDays } from "../db/settings";

const OPTIONS = [1, 3, 7, 14, 30];

export default function SettingsScreen() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    getRecentDays().then(setDays);
  }, []);

  async function choose(value: number) {
    setDays(value);
    await setRecentDays(value);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />
      <Text style={styles.section}>Words count as "Recent" for</Text>
      {OPTIONS.map((value) => (
        <Pressable key={value} style={styles.row} onPress={() => choose(value)}>
          <Text style={styles.label}>
            {value} {value === 1 ? "day" : "days"}
          </Text>
          {days === value && <FontAwesome name="check" size={20} color="#2563eb" />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  section: { fontSize: 14, color: "#666", marginBottom: 8, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  label: { fontSize: 17 },
});