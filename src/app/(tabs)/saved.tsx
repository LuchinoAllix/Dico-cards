import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  createCollection,
  deleteCollection,
  getCollections,
  renameCollection,
  getCollectionCounts,
  type Collection,
} from "../../db/collections";
import { useLanguageStore } from "../../state/language";
import LanguagePicker from "../../components/LanguagePicker";
import { countRecentWords, countSavedWords } from "../../db/saved";
import { getRecentDays } from "../../db/settings";
import { Text, TextInput } from "../../components/Text";
import type { Colors } from "../../theme/colors";
import { useThemedStyles } from "../../theme/useTheme";

interface Row {
  id: string;
  title: string;
  collection?: Collection; // only set for real collections
  count: number;
}

export default function SavedScreen() {
  const styles = useThemedStyles(makeStyles); 
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const language = useLanguageStore((s) => s.language);
  const [counts, setCounts] = useState({
    recent: 0,
    all: 0,
    byCollection: {} as Record<number, number>,
  });

  // reload depends on the language, so the list refreshes when it changes
  const reload = useCallback(async () => {
    const [list, all, recent, byCollection] = await Promise.all([
      getCollections(language),
      countSavedWords(language),
      getRecentDays().then((days) => countRecentWords(days, language)),
      getCollectionCounts(),
    ]);
    setCollections(list);
    setCounts({ all, recent, byCollection });
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function submit() {
    try {
      if (editingId === null) await createCollection(name, language);
      else await renameCollection(editingId, name);
      setName("");
      setEditingId(null);
      await reload();
    } catch {
      Alert.alert("Can't save", "The name is empty or already used.");
    }
  }

  function showActions(c: Collection) {
    Alert.alert(c.name, undefined, [
      {
        text: "Rename",
        onPress: () => {
          setEditingId(c.id);
          setName(c.name);
        },
      },
      { text: "Delete", style: "destructive", onPress: () => confirmDelete(c) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function confirmDelete(c: Collection) {
    Alert.alert(`Delete "${c.name}"?`, "The words stay in your saved words.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCollection(c.id);
          await reload();
        },
      },
    ]);
  }

  const rows: Row[] = [
    { id: "recent", title: "Recent", count: counts.recent },
    { id: "all", title: "All saved words", count: counts.all },
    ...collections.map((c) => ({
      id: String(c.id),
      title: c.name,
      collection: c,
      count: counts.byCollection[c.id] ?? 0,
    })),
  ];

  return (
    <View style={styles.container}>
      <LanguagePicker />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={editingId === null ? "New collection..." : "New name..."}
          placeholderTextColor="#888"
        />
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>{editingId === null ? "Add" : "Rename"}</Text>
        </Pressable>
        {editingId !== null && (
          <Pressable
            onPress={() => {
              setEditingId(null);
              setName("");
            }}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/collection/${item.id}`)}
            onLongPress={item.collection ? () => showActions(item.collection!) : undefined}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.count}>
              {item.count} {item.count === 1 ? "word" : "words"}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    input: {
      flex: 1, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, color: c.text,
      borderRadius: 8, padding: 10, fontSize: 16,
    },
    button: { backgroundColor: c.button, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8 },
    buttonText: { color: c.onButton, fontWeight: "600" },
    cancel: { color: c.textMuted },
    row: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border,
    },
    title: { fontSize: 18, fontWeight: "600" },
    count: { fontSize: 15, color: c.primary },
  });