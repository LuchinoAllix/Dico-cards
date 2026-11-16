// scripts/build-dictionary-db.mjs
//
// Converts a kaikki.org JSONL dictionary into a SQLite file for the app.
//
// Usage:
//   node scripts/build-dictionary-db.mjs <input.jsonl> --lang fr [--limit 0] [--out assets/dictionaries/fr.db]
//
// --limit 0 (default) means the whole file. Needs Node 22.13 or newer (node:sqlite).
//
// How it works, in two passes, so memory stays low even on a 6 GB file:
//   1. Stream the JSONL and store every useful meaning in a temporary table.
//   2. Read that table sorted by word, group the meanings of each word,
//      and write one row per word in the final database.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { DatabaseSync } from "node:sqlite";

// ---------- options ----------
const args = process.argv.slice(2);
const input = args[0];

function option(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

if (!input || input.startsWith("--")) {
  console.error("Usage: node scripts/build-dictionary-db.mjs <input.jsonl> --lang fr [--limit 0] [--out file.db]");
  process.exit(1);
}

const lang = option("lang", "fr");
const limit = Number(option("limit", "0")); // 0 = unlimited
const out = option("out", `assets/dictionaries/${lang}.db`);

// Parts of speech we don't want in a learner's dictionary (same list as the JSON script).
const SKIPPED_POS = new Set([
  "name",
  "prefix",
  "suffix",
  "infix",
  "interfix",
  "character",
  "symbol",
  "typographic variant",
]);

const MAX_EXAMPLES_PER_MEANING = 3;

// ---------- helpers ----------

// MUST stay identical to normalize() in src/db/search.ts, because the app
// searches this column with the normalized text typed by the user.
function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isFormOf(sense) {
  const tags = sense.tags ?? [];
  return tags.includes("form-of") || Boolean(sense.form_of) || Boolean(sense.alt_of);
}

function toMeaning(entry) {
  const definitions = [];
  const examples = [];

  for (const sense of entry.senses ?? []) {
    if (isFormOf(sense)) continue;
    const glosses = sense.glosses ?? [];
    if (glosses.length === 0) continue;

    definitions.push(glosses[glosses.length - 1]);

    for (const ex of sense.examples ?? []) {
      if (ex.text && examples.length < MAX_EXAMPLES_PER_MEANING) examples.push(ex.text);
    }
  }

  if (definitions.length === 0) return null;
  return { definitions, examples };
}

// ---------- pass 1: stream the file into a temporary table ----------
const tmpPath = path.join(os.tmpdir(), `dict-stage-${lang}-${Date.now()}.db`);
const stage = new DatabaseSync(tmpPath);
stage.exec(`
  PRAGMA journal_mode = OFF;
  PRAGMA synchronous = OFF;
  CREATE TABLE meanings (
    word TEXT NOT NULL,
    pos TEXT NOT NULL,
    ipa TEXT,
    definitions TEXT NOT NULL,
    examples TEXT
  );
`);
const insertMeaning = stage.prepare(
  "INSERT INTO meanings (word, pos, ipa, definitions, examples) VALUES (?, ?, ?, ?, ?)"
);

const seenWords = new Set(); // only used when --limit is set
let linesRead = 0;
let kept = 0;
let skippedBadJson = 0;

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

stage.exec("BEGIN");
const rl = readline.createInterface({
  input: fs.createReadStream(input, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.trim()) continue;
  linesRead++;
  if (linesRead % 100000 === 0) {
    console.log(`  ${linesRead} lines read, ${kept} meanings kept...`);
  }

  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    skippedBadJson++;
    continue;
  }

  if (!entry.word || !entry.pos) continue;
  if (entry.lang_code && entry.lang_code !== lang) continue;
  if (SKIPPED_POS.has(entry.pos)) continue;

  const meaning = toMeaning(entry);
  if (!meaning) continue;

  if (limit > 0 && !seenWords.has(entry.word)) {
    if (seenWords.size >= limit) break;
    seenWords.add(entry.word);
  }

  const ipa = (entry.sounds ?? []).find((s) => s.ipa)?.ipa ?? null;
  insertMeaning.run(
    entry.word,
    entry.pos,
    ipa,
    JSON.stringify(meaning.definitions),
    meaning.examples.length > 0 ? JSON.stringify(meaning.examples) : null
  );
  kept++;

  // Commit in batches so the transaction doesn't grow forever.
  if (kept % 50000 === 0) {
    stage.exec("COMMIT");
    stage.exec("BEGIN");
  }
}
rl.close();
stage.exec("COMMIT");

console.log("Grouping meanings by word...");
stage.exec("CREATE INDEX idx_meanings_word ON meanings(word)");

// ---------- pass 2: one row per word in the final database ----------
if (fs.existsSync(out)) fs.rmSync(out);
const db = new DatabaseSync(out);
db.exec(`
  PRAGMA journal_mode = OFF;
  PRAGMA synchronous = OFF;
  CREATE TABLE entries (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL,
    headword TEXT NOT NULL,
    pronunciation TEXT,
    meanings TEXT NOT NULL
  );
  CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
`);
const insertEntry = db.prepare(
  "INSERT OR IGNORE INTO entries (id, key, headword, pronunciation, meanings) VALUES (?, ?, ?, ?, ?)"
);

let wordCount = 0;
let current = null; // { word, ipa, meanings: [] }

function flush() {
  if (!current) return;
  insertEntry.run(
    `${lang}:${current.word}`,
    normalize(current.word),
    current.word,
    current.ipa,
    JSON.stringify(current.meanings)
  );
  wordCount++;
}

db.exec("BEGIN");
const rows = stage
  .prepare("SELECT word, pos, ipa, definitions, examples FROM meanings ORDER BY word, rowid")
  .iterate();

for (const row of rows) {
  if (!current || current.word !== row.word) {
    flush();
    current = { word: row.word, ipa: null, meanings: [] };
    if (wordCount > 0 && wordCount % 50000 === 0) {
      db.exec("COMMIT");
      db.exec("BEGIN");
      console.log(`  ${wordCount} words written...`);
    }
  }
  if (!current.ipa && row.ipa) current.ipa = row.ipa;

  const meaning = { partOfSpeech: row.pos, definitions: JSON.parse(row.definitions) };
  if (row.examples) meaning.examples = JSON.parse(row.examples);
  current.meanings.push(meaning);
}
flush();
db.exec("COMMIT");

// The key index is what makes prefix search fast.
db.exec("CREATE INDEX idx_entries_key ON entries(key)");
db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("language", lang);
db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("built_at", new Date().toISOString());
db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("entry_count", String(wordCount));
db.exec("VACUUM");
db.close();

stage.close();
fs.rmSync(tmpPath, { force: true });

const sizeMb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
console.log(`Lines read:      ${linesRead}`);
console.log(`Bad JSON lines:  ${skippedBadJson}`);
console.log(`Words written:   ${wordCount}`);
console.log(`Output:          ${out} (${sizeMb} MB)`);
