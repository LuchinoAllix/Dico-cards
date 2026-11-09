import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getRecentWords, getSavedWords, type SavedWord } from "../../db/saved";
import { getCollection, getWordsInCollection } from "../../db/collections";
import { getRecentDays } from "../../db/settings";

async function load(id: string): Promise<{ title: string; words: SavedWord[] }> {
  if (id === "recent") return { title: "Recent", words: await getRecentWords(await getRecentDays()) };
  if (id === "all") return { title: "All saved words", words: await getSavedWords() };
  const collectionId = Number(id);
  const collection = await getCollection(collectionId);
  return {
    title: collection?.name ?? "Collection",
    words: await getWordsInCollection(collectionId),
  };
}

export default function WordListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [words, setWords] = useState<SavedWord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load(id).then((result) => {
        if (cancelled) return;
        setTitle(result.title);
        setWords(result.words);
      });
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  return (
    <>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/word/${encodeURIComponent(item.id)}`)}
          >
            <Text style={styles.headword}>{item.headword}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.hint}>No words here yet.</Text>}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#ccc" },
  headword: { fontSize: 18 },
  hint: { textAlign: "center", color: "#888", marginTop: 24 },
});