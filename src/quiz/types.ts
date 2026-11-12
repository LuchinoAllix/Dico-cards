import type { DictionaryEntry } from "../types/dictionary";

export type QuizModeId = "flashcard" | "reverse";

// Every mode's card component receives these props.
export interface CardProps {
  entry: DictionaryEntry;
  revealed: boolean;
}