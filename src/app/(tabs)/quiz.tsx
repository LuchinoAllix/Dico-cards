import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getCollections } from "../../db/collections";
import { getDueWords, type QuizSource } from "../../db/quiz";
import { MODES, getMode } from "../../quiz/modes";
import type { QuizModeId } from "../../quiz/types";
import { useLanguageStore } from "../../state/language";
import LanguagePicker from "../../components/LanguagePicker";


interface SourceRow {
  key: string;
  title: string;
  source: QuizSource;
  due: number;
}

async function loadRows(mode: QuizModeId, language: string): Promise<SourceRow[]> {
  const collections = await getCollections(language);
  const defs = [
    { key: "recent", title: "Recent", source: { kind: "recent" } as QuizSource },
    { key: "all", title: "All saved words", source: { kind: "all" } as QuizSource },
    ...collections.map((c) => ({
      key: String(c.id),
      title: c.name,
      source: { kind: "collection", id: c.id } as QuizSource,
    })),
  ];

  return Promise.all(
    defs.map(async (d) => ({ ...d, due: (await getDueWords(d.source, mode, language, 1000)).length }))
  );
}

export default function QuizScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<QuizModeId>("flashcard");
  const [rows, setRows] = useState<SourceRow[]>([]);
  const language = useLanguageStore((s) => s.language);

  // Re-runs when the tab is shown and when the mode changes.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadRows(mode, language).then((result) => {
        if (!cancelled) setRows(result);
      });
      return () => {
        cancelled = true;
      };
    }, [mode, language])
  );

  return (
    <View style={styles.container}>
      <LanguagePicker />
      <Text style={styles.intro}>Mode</Text>
      <View style={styles.modeRow}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.modeButton, m.id === mode && styles.modeButtonActive]}
            onPress={() => setMode(m.id)}
          >
            <Text style={[styles.modeText, m.id === mode && styles.modeTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.description}>{getMode(mode).description}</Text>

      <Text style={[styles.intro, { marginTop: 20 }]}>Choose what to study</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const disabled = item.due === 0;
          return (
            <Pressable
              style={[styles.row, disabled && styles.rowDisabled]}
              disabled={disabled}
              onPress={() => router.push(`/study/${item.key}?mode=${mode}`)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.count}>{disabled ? "Nothing due" : `${item.due} due`}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.hint}>Loading...</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  intro: { fontSize: 14, color: "#666", textTransform: "uppercase", marginBottom: 8 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  modeButtonActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  modeText: { fontSize: 14, fontWeight: "600", color: "#333" },
  modeTextActive: { color: "white" },
  description: { fontSize: 14, color: "#666", marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  rowDisabled: { opacity: 0.4 },
  title: { fontSize: 18, fontWeight: "600" },
  count: { fontSize: 15, color: "#2563eb" },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
});