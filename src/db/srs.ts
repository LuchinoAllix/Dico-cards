import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { getUserDb } from "./userDb";

export type Grade = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

const scheduler = fsrs();

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

// Records one answer and returns the next due date.
export async function reviewWord(id: string, grade: Grade): Promise<Date> {
  const db = await getUserDb();
  const row = await db.getFirstAsync<{ card: string | null }>(
    "SELECT card FROM saved_words WHERE id = ?",
    [id]
  );
  if (!row) throw new Error("Word is not saved");

  const { card } = scheduler.next(parseCard(row.card), new Date(), grade);

  await db.runAsync("UPDATE saved_words SET card = ?, due_at = ? WHERE id = ?", [
    JSON.stringify(card),
    card.due.getTime(),
    id,
  ]);
  return card.due;
}