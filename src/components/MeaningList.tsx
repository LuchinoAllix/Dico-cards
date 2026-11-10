import { StyleSheet, Text, View } from "react-native";
import type { Meaning } from "../types/dictionary";

export default function MeaningList({ meanings }: { meanings: Meaning[] }) {
  return (
    <>
      {meanings.map((meaning, i) => (
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
    </>
  );
}

const styles = StyleSheet.create({
  meaning: { marginTop: 20 },
  pos: { fontSize: 14, fontWeight: "600", color: "#2563eb", textTransform: "uppercase" },
  definition: { fontSize: 16, marginTop: 6 },
  example: { fontSize: 15, fontStyle: "italic", color: "#555", marginTop: 6 },
});