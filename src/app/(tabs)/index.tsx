import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { DICTIONARIES } from "../../db/dictionaries";
import { getWordOfTheDay } from "../../db/search";
import { isSaved, saveWord, unsaveWord } from "../../db/saved";
import type { DictionaryEntry } from "../../types/dictionary";

interface DailyWord {
  code: string;
  label: string;
  entry: DictionaryEntry;
  saved: boolean;
}

async function loadDailyWords(): Promise<DailyWord[]> {
  const loaded = await Promise.all(
    DICTIONARIES.map(async (d) => {
      const entry = await getWordOfTheDay(d.code);
      if (!entry) return null;
      return { code: d.code, label: d.label, entry, saved: await isSaved(entry.id) };
    })
  );
  return loaded.filter((w): w is DailyWord => w !== null);
}

export default function HomeScreen() {
  const router = useRouter();
  const [words, setWords] = useState<DailyWord[]>([]);

  // Re-runs each time the tab is shown: picks up a new day and saves made elsewhere.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadDailyWords().then((result) => {
        if (!cancelled) setWords(result);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function toggleSaved(word: DailyWord) {
    if (word.saved) await unsaveWord(word.entry.id);
    else await saveWord(word.entry);
    setWords((list) => list.map((w) => (w.code === word.code ? { ...w, saved: !w.saved } : w)));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.recentButton} onPress={() => router.push("/collection/recent-all")}>
        <FontAwesome name="clock-o" size={20} color="#2563eb" />
        <Text style={styles.recentText}>Recent words</Text>
        <Text style={styles.recentSub}>all languages</Text>
        <FontAwesome name="angle-right" size={20} color="#999" />
      </Pressable>

      <Text style={styles.section}>Word of the day</Text>

      {words.map((w) => {
        const meaning = w.entry.meanings[0];
        return (
          <Pressable
            key={w.code}
            style={styles.card}
            onPress={() => router.push(`/word/${encodeURIComponent(w.entry.id)}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.language}>{w.label}</Text>
              <Pressable
                style={[styles.saveButton, w.saved && styles.savedButton]}
                onPress={() => toggleSaved(w)}
                hitSlop={8}
              >
                <Text style={styles.saveText}>{w.saved ? "Saved ✓" : "Save"}</Text>
              </Pressable>
            </View>

            <Text style={styles.headword}>{w.entry.headword}</Text>
            {w.entry.pronunciation && <Text style={styles.pron}>{w.entry.pronunciation}</Text>}
            {meaning && (
              <Text style={styles.definition} numberOfLines={3}>
                <Text style={styles.pos}>{meaning.partOfSpeech}  </Text>
                {meaning.definitions[0]}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  recentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  recentText: { fontSize: 17, fontWeight: "600" },
  recentSub: { flex: 1, fontSize: 13, color: "#888" },
  section: {
    fontSize: 14,
    color: "#666",
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  language: { fontSize: 13, fontWeight: "600", color: "#2563eb", textTransform: "uppercase" },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savedButton: { backgroundColor: "#16a34a" },
  saveText: { color: "white", fontWeight: "600", fontSize: 13 },
  headword: { fontSize: 26, fontWeight: "700", marginTop: 8 },
  pron: { fontSize: 15, color: "#666", marginTop: 2 },
  definition: { fontSize: 15, color: "#333", marginTop: 8 },
  pos: { fontSize: 12, fontWeight: "600", color: "#2563eb", textTransform: "uppercase" },
});