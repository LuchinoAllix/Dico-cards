import type { DictionaryEntry } from "../types/dictionary";

export interface DictionaryInfo {
  code: string; // same code as the --lang option and the id prefix
  label: string;
  load: () => DictionaryEntry[];
}

// Metro needs the file path written literally inside require(), so each file
// is listed by hand. The JSON is only read when load() is first called.
export const DICTIONARIES: DictionaryInfo[] = [
  { code: "fr", label: "Français", load: () => require("../data/words.fr.json") },
  { code: "en", label: "English", load: () => require("../data/words.en.json") },
  { code: "it", label: "Italiano", load: () => require("../data/words.it.json") },
];

export const DEFAULT_LANGUAGE = "fr";