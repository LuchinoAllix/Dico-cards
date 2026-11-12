import type { ComponentType } from "react";
import FlashcardCard from "../components/cards/FlashcardCard";
import ReverseCard from "../components/cards/ReverseCard";
import type { CardProps, QuizModeId } from "./types";

export interface QuizMode {
  id: QuizModeId;
  label: string;
  description: string;
  Card: ComponentType<CardProps>;
}

export const MODES: QuizMode[] = [
  {
    id: "flashcard",
    label: "Word → meaning",
    description: "See the word, recall its meaning.",
    Card: FlashcardCard,
  },
  {
    id: "reverse",
    label: "Meaning → word",
    description: "See the meaning, recall the word.",
    Card: ReverseCard,
  },
];

// Unknown or missing id falls back to the first mode.
export function getMode(id?: string): QuizMode {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}