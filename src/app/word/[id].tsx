import { Stack, useLocalSearchParams  } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, FlatList } from "react-native";
import { isSaved, saveWord, unsaveWord } from "../../db/saved";
import { getEntry } from "../../db/search";
import type { DictionaryEntry } from "../../types/dictionary";


export default function WordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<DictionaryEntry | undefined>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) isSaved(id).then(setSaved);
  }, [id]);

  async function toggleSaved() {
    if (!entry) return;
    if (saved) await unsaveWord(entry.id);
    else await saveWord(entry);
    setSaved(!saved);
  }

  useEffect(() => {
    if (id) getEntry(id).then(setEntry);
  }, [id]);

  if (!entry) {
    return <Text style={styles.hint}>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: entry.headword }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headword}>{entry.headword}</Text>
          {entry.pronunciation && <Text style={styles.pron}>{entry.pronunciation}</Text>}
        </View>
        <Pressable style={[styles.saveButton, saved && styles.savedButton]} onPress={toggleSaved}>
          <Text style={styles.saveText}>{saved ? "Saved ✓" : "Save"}</Text>
        </Pressable>
      </View>

      {entry.meanings.map((meaning, i) => (
        <View key={i} style={styles.meaning}>
          <Text style={styles.pos}>{meaning.partOfSpeech}</Text>
          {meaning.definitions.map((def, j) => (
            <Text key={j} style={styles.definition}>
              {j + 1}. {def}
            </Text>
          ))}
          {meaning.examples?.map((ex, k) => (
            <Text key={k} style={styles.example}>
              “{ex}”
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headword: { fontSize: 28, fontWeight: "700" },
  pron: { fontSize: 16, color: "#666", marginTop: 2 },
  saveButton: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveText: { color: "white", fontWeight: "600" },
  meaning: { marginTop: 20 },
  pos: { fontSize: 14, fontWeight: "600", color: "#2563eb", textTransform: "uppercase" },
  definition: { fontSize: 16, marginTop: 6 },
  example: { fontSize: 15, fontStyle: "italic", color: "#555", marginTop: 6 },
  hint: { textAlign: "center", marginTop: 24, color: "#888" },
  savedButton: { backgroundColor: "#16a34a" },
});