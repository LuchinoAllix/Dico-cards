import { StyleSheet, View } from "react-native";
import type { CardProps } from "../../quiz/types";
import { Text } from "../Text";
import type { Colors } from "../../theme/colors";
import { useThemedStyles } from "../../theme/useTheme";

const MAX_MEANINGS = 3;
const MAX_EXAMPLES = 2;

// Definitions sometimes contain the word itself, which would give the answer away.
function maskWord(text: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), "…");
}

export default function ReverseCard({ entry, revealed }: CardProps) {
  const examples = entry.meanings.flatMap((m) => m.examples ?? []).slice(0, MAX_EXAMPLES);
  const styles = useThemedStyles(makeStyles);
  
  return (
    <>
      <Text style={styles.prompt}>Which word is it?</Text>

      {entry.meanings.slice(0, MAX_MEANINGS).map((meaning, i) => (
        <View key={i} style={styles.meaning}>
          <Text style={styles.pos}>{meaning.partOfSpeech}</Text>
          <Text style={styles.definition}>{maskWord(meaning.definitions[0], entry.headword)}</Text>
        </View>
      ))}

      {revealed && (
        <View style={styles.answer}>
          <Text style={styles.headword}>{entry.headword}</Text>
          {entry.pronunciation && <Text style={styles.pron}>{entry.pronunciation}</Text>}
          {examples.map((ex, i) => (
            <Text key={i} style={styles.example}>
              “{ex}”
            </Text>
          ))}
        </View>
      )}
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    prompt: { fontSize: 14, color: c.textMuted, textAlign: "center", textTransform: "uppercase" },
    meaning: { marginTop: 20 },
    pos: { fontSize: 14, fontWeight: "600", color: c.primary, textTransform: "uppercase" },
    definition: { fontSize: 20, marginTop: 6 },
    answer: { marginTop: 32, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    headword: { fontSize: 34, fontWeight: "700", textAlign: "center" },
    pron: { fontSize: 16, color: c.textMuted, textAlign: "center", marginTop: 4 },
    example: { fontSize: 15, fontStyle: "italic", color: c.textMuted, marginTop: 10 },
  });