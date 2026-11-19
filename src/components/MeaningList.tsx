import { StyleSheet, View } from "react-native";
import type { Meaning } from "../types/dictionary";
import { Text } from "./Text";
import type { Colors } from "../theme/colors";
import { useThemedStyles } from "../theme/useTheme";

export default function MeaningList({ meanings }: { meanings: Meaning[] }) {
  const styles = useThemedStyles(makeStyles); 
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    meaning: { marginTop: 20 },
    pos: { fontSize: 14, fontWeight: "600", color: c.primary, textTransform: "uppercase" },
    definition: { fontSize: 16, marginTop: 6 },
    example: { fontSize: 15, fontStyle: "italic", color: c.textMuted, marginTop: 6 },
  });