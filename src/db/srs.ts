import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { getUserDb } from "./userDb";
import { getRetention } from "./settings";
import type { QuizModeId } from "../quiz/types";

export type Grade = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

const GRADES: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

async function getScheduler() {
  return fsrs({ request_retention: await getRetention() });
}

function parseCard(json: string): Card {
  const raw = JSON.parse(json);
  return {
    ...raw,
    due: new Date(raw.due),
    last_review: raw.last_review ? new Date(raw.last_review) : undefined,
  };
}

// No row for this (word, mode) means the word is new in this mode.
async function loadCard(id: string, mode: QuizModeId): Promise<Card> {
  const db = await getUserDb();
  const row = await db.getFirstAsync<{ card: string }>(
    "SELECT card FROM card_states WHERE word_id = ? AND mode = ?",
    [id, mode]
  );
  return row ? parseCard(row.card) : createEmptyCard(new Date());
}

export async function reviewWord(id: string, mode: QuizModeId, grade: Grade): Promise<Date> {
  const db = await getUserDb();
  const scheduler = await getScheduler();
  const { card } = scheduler.next(await loadCard(id, mode), new Date(), grade);

  await db.runAsync(
    `INSERT INTO card_states (word_id, mode, card, due_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(word_id, mode) DO UPDATE SET card = excluded.card, due_at = excluded.due_at`,
    [id, mode, JSON.stringify(card), card.due.getTime()]
  );
  return card.due;
}


export function formatInterval(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo`;
  return `${(days / 365).toFixed(1)} y`;
}

export async function previewIntervals(id: string, mode: QuizModeId): Promise<Record<Grade, string>> {
  const scheduler = await getScheduler();
  const now = new Date();
  const outcomes = scheduler.repeat(await loadCard(id, mode), now);

  const labels = {} as Record<Grade, string>;
  for (const grade of GRADES) {
    labels[grade] = formatInterval(outcomes[grade].card.due.getTime() - now.getTime());
  }
  return labels;
}