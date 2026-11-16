export interface DictionaryInfo {
  code: string; // same code as the --lang option and the id prefix
  label: string;
  dbName: string; // file name on the phone
  asset: number; // what require() returns for a bundled file
  version: number; // bump this when you rebuild the .db
}

// Comment out the languages you haven't built yet: Metro fails if a file is missing.
export const DICTIONARIES: DictionaryInfo[] = [
  {
    code: "fr",
    label: "Français",
    dbName: "dictionary-fr.db",
    asset: require("../../assets/dictionaries/fr.db"),
    version: 2,
  },
  // { code: "en", label: "English", dbName: "dictionary-en.db", asset: require("../../assets/dictionaries/en.db"), version: 1 },
  // { code: "it", label: "Italiano", dbName: "dictionary-it.db", asset: require("../../assets/dictionaries/it.db"), version: 1 },
];

export const DEFAULT_LANGUAGE = "fr";