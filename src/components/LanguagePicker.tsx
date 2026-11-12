import { Pressable, StyleSheet, Text, View } from "react-native";
import { DICTIONARIES } from "../db/dictionaries";
import { useLanguageStore } from "../state/language";

export default function LanguagePicker() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <View style={styles.row}>
      {DICTIONARIES.map((d) => {
        const active = d.code === language;
        return (
          <Pressable
            key={d.code}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setLanguage(d.code)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{d.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#ccc" },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  text: { fontSize: 14, fontWeight: "600", color: "#333" },
  textActive: { color: "white" },
});