import { DICTIONARIES } from "./dictionaries";
import type { DictionaryEntry } from "../types/dictionary";

interface LoadedDictionary {
  byId: Map<string, DictionaryEntry>;
  index: { entry: DictionaryEntry; key: string }[];
}

const cache = new Map<string, LoadedDictionary>();

// Lowercase and strip accents, so "ecole" finds "école".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Loads and indexes a dictionary the first time it's needed, then reuses it.
function getDictionary(language: string): LoadedDictionary {
  let loaded = cache.get(language);
  if (!loaded) {
    const info = DICTIONARIES.find((d) => d.code === language);
    const entries = info ? info.load() : [];
    loaded = {
      byId: new Map(entries.map((e) => [e.id, e])),
      index: entries
        .map((entry) => ({ entry, key: normalize(entry.headword) }))
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
    };
    cache.set(language, loaded);
  }
  return loaded;
}

export async function searchWords(
  language: string,
  query: string,
  limit = 20
): Promise<DictionaryEntry[]> {
  const q = normalize(query);
  if (!q) return [];
  return getDictionary(language)
    .index.filter((item) => item.key.startsWith(q))
    .slice(0, limit)
    .map((item) => item.entry);
}

// ids look like "fr:gratis": the language is everything before the first colon.
export async function getEntry(id: string): Promise<DictionaryEntry | undefined> {
  const language = id.slice(0, id.indexOf(":"));
  return getDictionary(language).byId.get(id);
}