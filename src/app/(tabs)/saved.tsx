import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

const ROWS = [
  { id: "recent", title: "Recent" },
  { id: "all", title: "All saved words" },
];

export default function SavedScreen() {
  const router = useRouter();
  return (
    <FlatList
      data={ROWS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/collection/${item.id}`)}>
          <Text style={styles.title}>{item.title}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#ccc" },
  title: { fontSize: 18, fontWeight: "600" },
});