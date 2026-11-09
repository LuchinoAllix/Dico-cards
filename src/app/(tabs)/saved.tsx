import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  createCollection,
  deleteCollection,
  getCollections,
  renameCollection,
  type Collection,
} from "../../db/collections";

interface Row {
  id: string;
  title: string;
  collection?: Collection; // only set for real collections
}

const VIRTUAL_ROWS: Row[] = [
  { id: "recent", title: "Recent" },
  { id: "all", title: "All saved words" },
];

export default function SavedScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setCollections(await getCollections());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  async function submit() {
    try {
      if (editingId === null) await createCollection(name);
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
    ...VIRTUAL_ROWS,
    ...collections.map((c) => ({ id: String(c.id), title: c.name, collection: c })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={editingId === null ? "New collection..." : "New name..."}
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
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 16 },
  button: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8 },
  buttonText: { color: "white", fontWeight: "600" },
  cancel: { color: "#666" },
  row: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#ccc" },
  title: { fontSize: 18, fontWeight: "600" },
});