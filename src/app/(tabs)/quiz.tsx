import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getCollections } from "../../db/collections";
import { getDueWords, type QuizSource } from "../../db/quiz";

interface SourceRow {
  key: string; // goes in the URL: "recent", "all" or the collection id
  title: string;
  source: QuizSource;
  due: number;
}

async function loadRows(): Promise<SourceRow[]> {
  const collections = await getCollections();

  const defs = [
    { key: "recent", title: "Recent", source: { kind: "recent" } as QuizSource },
    { key: "all", title: "All saved words", source: { kind: "all" } as QuizSource },
    ...collections.map((c) => ({
      key: String(c.id),
      title: c.name,
      source: { kind: "collection", id: c.id } as QuizSource,
    })),
  ];

  // Count what's due in each source (the limit is just a high cap for counting).
  return Promise.all(
    defs.map(async (d) => ({ ...d, due: (await getDueWords(d.source, 1000)).length }))
  );
}

export default function QuizScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<SourceRow[]>([]);

  // Re-run every time the tab is shown, so counts are fresh after a session.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadRows().then((result) => {
        if (!cancelled) setRows(result);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>Choose what to study</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const disabled = item.due === 0;
          return (
            <Pressable
              style={[styles.row, disabled && styles.rowDisabled]}
              disabled={disabled}
              onPress={() => router.push(`/study/${item.key}`)}
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