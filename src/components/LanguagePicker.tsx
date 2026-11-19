import { Pressable, StyleSheet, View } from "react-native";
import { DICTIONARIES } from "../db/dictionaries";
import { useLanguageStore } from "../state/language";
import { Text } from "./Text";
import type { Colors } from "../theme/colors";
import { useThemedStyles } from "../theme/useTheme";

export default function LanguagePicker() {
  const styles = useThemedStyles(makeStyles); 
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border },
    chipActive: { backgroundColor: c.button, borderColor: c.button },
    text: { fontSize: 14, fontWeight: "600", color: c.text },
    textActive: { color: c.onButton },
  });