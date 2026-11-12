import { StyleSheet, Text } from "react-native";
import MeaningList from "../MeaningList";
import type { CardProps } from "../../quiz/types";

export default function FlashcardCard({ entry, revealed }: CardProps) {
  return (
    <>
      <Text style={styles.headword}>{entry.headword}</Text>
      {entry.pronunciation && <Text style={styles.pron}>{entry.pronunciation}</Text>}
      {revealed && <MeaningList meanings={entry.meanings} />}
    </>
  );
}

const styles = StyleSheet.create({
  headword: { fontSize: 34, fontWeight: "700", textAlign: "center" },
  pron: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 4 },
});