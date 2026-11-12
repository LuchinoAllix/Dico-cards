import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Rating } from "ts-fsrs";
import { getEntry } from "../../db/search";
import { getDueWords, type QuizSource } from "../../db/quiz";
import { previewIntervals, reviewWord, type Grade } from "../../db/srs";
import { getSessionSize } from "../../db/settings";
import { getMode } from "../../quiz/modes";
import type { SavedWord } from "../../db/saved";
import type { DictionaryEntry } from "../../types/dictionary";
import { useLanguageStore } from "../../state/language";


function parseSource(param: string): QuizSource {
  if (param === "recent") return { kind: "recent" };
  if (param === "all") return { kind: "all" };
  return { kind: "collection", id: Number(param) };
}

const GRADES: { label: string; grade: Grade; color: string }[] = [
  { label: "Again", grade: Rating.Again, color: "#dc2626" },
  { label: "Hard", grade: Rating.Hard, color: "#ea580c" },
  { label: "Good", grade: Rating.Good, color: "#16a34a" },
  { label: "Easy", grade: Rating.Easy, color: "#2563eb" },
];

export default function StudyScreen() {
  const { source, mode } = useLocalSearchParams<{ source: string; mode?: string }>();
  const router = useRouter();
  const quizMode = getMode(mode);
  const ModeCard = quizMode.Card;

  const [queue, setQueue] = useState<SavedWord[] | null>(null);
  const [total, setTotal] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [entry, setEntry] = useState<DictionaryEntry | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [intervals, setIntervals] = useState<Record<Grade, string> | null>(null);

  const language = useLanguageStore((s) => s.language);

  const current = queue?.[0];

  // 1. Load the words that are due, once.
  useEffect(() => {
    let cancelled = false;
    getSessionSize()
      .then((size) => getDueWords(parseSource(source), quizMode.id, language, size))
      .then((words) => {
        if (cancelled) return;
        setQueue(words);
        setTotal(words.length);
      });
    return () => {
      cancelled = true;
    };
  }, [source, quizMode.id, language]);

  // 2. Each time the current word changes, load its dictionary entry.
  useEffect(() => {
    setEntry(undefined);
    setRevealed(false);
    setIntervals(null);
    if (!current) return;

    let cancelled = false;
    getEntry(current.id).then((found) => {
      if (cancelled) return;
      if (found) {
        setEntry(found);
      } else {
        // Word no longer in the dictionary: skip it instead of crashing.
        setQueue((q) => q?.slice(1) ?? q);
        setTotal((t) => t - 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  // 3. When the answer is shown, compute what each button would do.
  useEffect(() => {
    if (!revealed || !current) return;
    let cancelled = false;
    previewIntervals(current.id, quizMode.id).then((result) => {
      if (!cancelled) setIntervals(result);
    });
    return () => {
      cancelled = true;
    };
  }, [revealed, current?.id, quizMode.id]);

  async function answer(grade: Grade) {
    if (!current || busy) return;
    setBusy(true);
    try {
      await reviewWord(current.id, quizMode.id, grade);
      setQueue((q) => {
        if (!q) return q;
        const [first, ...rest] = q;
        return grade === Rating.Again ? [...rest, first] : rest;
      });
      if (grade !== Rating.Again) setReviewed((n) => n + 1);
      setRevealed(false);
      setIntervals(null);
    } finally {
      setBusy(false);
    }
  }

  if (queue === null) {
    return <Text style={styles.hint}>Loading...</Text>;
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Study" }} />
        <Text style={styles.doneTitle}>{total === 0 ? "Nothing to review" : "Done!"}</Text>
        {total > 0 && (
          <Text style={styles.hint}>
            {reviewed} {reviewed === 1 ? "word" : "words"} reviewed
          </Text>
        )}
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Back to quiz</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${reviewed} / ${total}` }} />

      <ScrollView contentContainerStyle={styles.card}>
        {entry ? (
          <ModeCard entry={entry} revealed={revealed} />
        ) : (
          <Text style={styles.hint}>Loading...</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!revealed ? (
          <Pressable
            style={[styles.primaryButton, !entry && styles.disabled]}
            disabled={!entry}
            onPress={() => setRevealed(true)}
          >
            <Text style={styles.primaryText}>Show answer</Text>
          </Pressable>
        ) : (
          <View style={styles.gradeRow}>
            {GRADES.map((g) => (
              <Pressable
                key={g.label}
                style={[styles.gradeButton, { backgroundColor: g.color }, busy && styles.disabled]}
                disabled={busy}
                onPress={() => answer(g.grade)}
              >
                <Text style={styles.gradeText}>{g.label}</Text>
                <Text style={styles.intervalText}>{intervals?.[g.grade] ?? " "}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 24, paddingTop: 40 },
  footer: { padding: 16 },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 17, fontWeight: "600" },
  gradeRow: { flexDirection: "row", gap: 8 },
  gradeButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  gradeText: { color: "white", fontWeight: "600", fontSize: 15 },
  intervalText: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  disabled: { opacity: 0.5 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  doneTitle: { fontSize: 26, fontWeight: "700" },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
});