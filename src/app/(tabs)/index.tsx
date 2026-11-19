import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../components/Text";
import { DICTIONARIES } from "../../db/dictionaries";
import { isSaved, saveWord, unsaveWord } from "../../db/saved";
import { getWordOfTheDay } from "../../db/search";
import type { Colors } from "../../theme/colors";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const [words, setWords] = useState<DailyWord[]>([]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") loadDailyWords().then(setWords);
    });
    return () => subscription.remove();
  }, []);

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
    <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
      <Pressable style={styles.recentButton} onPress={() => router.push("/collection/recent-all")}>
        <FontAwesome name="clock-o" size={20} color={colors.primary} />
        <Text style={styles.recentText}>Recent words</Text>
        <Text style={styles.recentSub}>all languages</Text>
        <FontAwesome name="angle-right" size={20} color={colors.textFaint} />
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flexGrow: 1,
      padding: 16,
      backgroundColor: c.background,
    },
    recentButton: {
      flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.surface,
    },
    recentText: { fontSize: 17, fontWeight: "600" },
    recentSub: { flex: 1, fontSize: 13, color: c.textFaint },
    section: { fontSize: 14, color: c.textMuted, textTransform: "uppercase", marginTop: 24, marginBottom: 8 },
    card: {
      padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surface, marginBottom: 12,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    language: { fontSize: 13, fontWeight: "600", color: c.primary, textTransform: "uppercase" },
    saveButton: { backgroundColor: c.button, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    savedButton: { backgroundColor: c.success },
    saveText: { color: c.onButton, fontWeight: "600", fontSize: 13 },
    headword: { fontSize: 26, fontWeight: "700", marginTop: 8 },
    pron: { fontSize: 15, color: c.textMuted, marginTop: 2 },
    definition: { fontSize: 15, color: c.text, marginTop: 8 },
    pos: { fontSize: 12, fontWeight: "600", color: c.primary, textTransform: "uppercase" },
  });