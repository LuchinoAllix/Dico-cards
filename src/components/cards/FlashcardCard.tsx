import { StyleSheet } from "react-native";
import MeaningList from "../MeaningList";
import type { CardProps } from "../../quiz/types";
import { Text } from "../Text";
import type { Colors } from "../../theme/colors";
import { useThemedStyles } from "../../theme/useTheme";


export default function FlashcardCard({ entry, revealed }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      <Text style={styles.headword}>{entry.headword}</Text>
      {entry.pronunciation && <Text style={styles.pron}>{entry.pronunciation}</Text>}
      {revealed && <MeaningList meanings={entry.meanings} />}
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    headword: { fontSize: 34, fontWeight: "700", textAlign: "center" },
    pron: { fontSize: 16, color: c.textMuted, textAlign: "center", marginTop: 4 },
  });