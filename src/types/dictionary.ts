export interface Meaning {
  partOfSpeech: string;
  definitions: string[];
  examples?: string[];
}

export interface DictionaryEntry {
  id: string;
  headword: string;
  language: string;
  pronunciation?: string;
  meanings: Meaning[];
}