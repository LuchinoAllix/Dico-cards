import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { getUserDb } from "./userDb";
import { getRetention } from "./settings";

export type Grade = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

const GRADES: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

async function getScheduler() {
  return fsrs({ request_retention: await getRetention() });
}

// The card is saved as JSON, so its dates come back as strings: convert them back.
function parseCard(json: string | null): Card {
  if (!json) return createEmptyCard(new Date());
  const raw = JSON.parse(json);
  return {
    ...raw,
    due: new Date(raw.due),
    last_review: raw.last_review ? new Date(raw.last_review) : undefined,
  };
}

async function loadCard(id: string): Promise<Card> {
  const db = await getUserDb();
  const row = await db.getFirstAsync<{ card: string | null }>(
    "SELECT card FROM saved_words WHERE id = ?",
    [id]
  );
  if (!row) throw new Error("Word is not saved");
  return parseCard(row.card);
}

// Records one answer and returns the next due date.
export async function reviewWord(id: string, grade: Grade): Promise<Date> {
  const db = await getUserDb();
  const scheduler = await getScheduler();
  const { card } = scheduler.next(await loadCard(id), new Date(), grade);

  await db.runAsync("UPDATE saved_words SET card = ?, due_at = ? WHERE id = ?", [
    JSON.stringify(card),
    card.due.getTime(),
    id,
  ]);
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

// What each button would do, e.g. { 1: "1 min", 2: "5 min", 3: "10 min", 4: "4 d" }.
export async function previewIntervals(id: string): Promise<Record<Grade, string>> {
  const scheduler = await getScheduler();
  const now = new Date();
  const outcomes = scheduler.repeat(await loadCard(id), now);

  const labels = {} as Record<Grade, string>;
  for (const grade of GRADES) {
    labels[grade] = formatInterval(outcomes[grade].card.due.getTime() - now.getTime());
  }
  return labels;
}