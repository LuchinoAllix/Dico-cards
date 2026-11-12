import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { searchWords } from "../../db/search";
import type { DictionaryEntry } from "../../types/dictionary";
import LanguagePicker from "../../components/LanguagePicker";
import { useLanguageStore } from "../../state/language";

export default function DictionaryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    let cancelled = false;
    searchWords(language, query).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => {
      cancelled = true;
    };
  }, [query, language]);

  return (
    <View style={styles.container}>
      <LanguagePicker />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search a word..."
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: "/word/[id]", params: { id: item.id } })}
          >
            <Text style={styles.headword}>{item.headword}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.meanings[0]?.definitions[0]}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.hint}>
            {query.trim() ? "No words found." : "Type to search the dictionary."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#ccc" },
  headword: { fontSize: 18, fontWeight: "600" },
  preview: { fontSize: 14, color: "#666", marginTop: 2 },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
});