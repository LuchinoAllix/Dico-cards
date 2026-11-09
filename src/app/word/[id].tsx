import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { getEntry } from "../../db/search";
import { isSaved, saveWord, unsaveWord } from "../../db/saved";
import {
  addToCollection,
  createCollection,
  getCollectionIdsForWord,
  getCollections,
  removeFromCollection,
  type Collection,
} from "../../db/collections";
import type { DictionaryEntry } from "../../types/dictionary";

export default function WordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<DictionaryEntry | undefined>();
  const [saved, setSaved] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!id) return;
    getEntry(id).then(setEntry);
    isSaved(id).then(setSaved);
  }, [id]);

  async function toggleSaved() {
    if (!entry) return;
    if (saved) {
      await unsaveWord(entry.id);
      setMemberIds(new Set());
    } else {
      await saveWord(entry);
    }
    setSaved(!saved);
  }

  async function refreshPicker(wordId: string) {
    const [all, memberOf] = await Promise.all([getCollections(), getCollectionIdsForWord(wordId)]);
    setCollections(all);
    setMemberIds(new Set(memberOf));
  }

  async function openPicker() {
    if (!entry) return;
    await refreshPicker(entry.id);
    setPickerOpen(true);
  }

  async function toggleMembership(collectionId: number) {
    if (!entry) return;
    if (memberIds.has(collectionId)) await removeFromCollection(collectionId, entry.id);
    else await addToCollection(collectionId, entry.id);
    await refreshPicker(entry.id);
  }

  async function handleCreate() {
    if (!entry) return;
    try {
      const newId = await createCollection(newName);
      await addToCollection(newId, entry.id);
      setNewName("");
      await refreshPicker(entry.id);
    } catch {
      Alert.alert("Can't create", "The name is empty or already used.");
    }
  }

  if (!entry) {
    return <Text style={styles.hint}>Loading...</Text>;
  }

  return (
    <>
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

        {saved && (
          <Pressable onPress={openPicker} style={styles.collectionButton}>
            <Text style={styles.collectionButtonText}>
              Add to collection{memberIds.size > 0 ? ` (${memberIds.size})` : ""}
            </Text>
          </Pressable>
        )}

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

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Add to collection</Text>

            <FlatList
              data={collections}
              keyExtractor={(c) => String(c.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.checkRow} onPress={() => toggleMembership(item.id)}>
                  <FontAwesome
                    name={memberIds.has(item.id) ? "check-square-o" : "square-o"}
                    size={24}
                    color="#2563eb"
                  />
                  <Text style={styles.checkLabel}>{item.name}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.hint}>No collections yet.</Text>}
            />

            <View style={styles.newRow}>
              <TextInput
                style={styles.newInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="New collection..."
              />
              <Pressable style={styles.saveButton} onPress={handleCreate}>
                <Text style={styles.saveText}>Add</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setPickerOpen(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headword: { fontSize: 28, fontWeight: "700" },
  pron: { fontSize: 16, color: "#666", marginTop: 2 },
  saveButton: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  savedButton: { backgroundColor: "#16a34a" },
  saveText: { color: "white", fontWeight: "600" },
  collectionButton: { marginTop: 12, alignSelf: "flex-start" },
  collectionButtonText: { color: "#2563eb", fontSize: 16 },
  meaning: { marginTop: 20 },
  pos: { fontSize: 14, fontWeight: "600", color: "#2563eb", textTransform: "uppercase" },
  definition: { fontSize: 16, marginTop: 6 },
  example: { fontSize: 15, fontStyle: "italic", color: "#555", marginTop: 6 },
  hint: { textAlign: "center", marginTop: 24, color: "#888" },

  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  checkLabel: { fontSize: 16 },
  newRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  newInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 16 },
  doneButton: { alignItems: "center", paddingVertical: 14 },
  doneText: { fontSize: 16, fontWeight: "600" },
});