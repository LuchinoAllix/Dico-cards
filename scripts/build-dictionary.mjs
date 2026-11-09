// scripts/build-dictionary.mjs
//
// Converts a kaikki.org JSONL dictionary into the app's own JSON format.
//
// Usage:
//   node scripts/build-dictionary.mjs <input.jsonl> [--lang fr] [--limit 100] [--out src/data/words.fr.json]
//
// --limit 0 means "no limit" (use this for the full dictionary).

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// ---------- options ----------
const args = process.argv.slice(2);
const input = args[0];

function option(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

if (!input || input.startsWith("--")) {
  console.error("Usage: node scripts/build-dictionary.mjs <input.jsonl> [--lang fr] [--limit 100] [--out file.json]");
  process.exit(1);
}

const lang = option("lang", "fr");
const limit = Number(option("limit", "100")); // 0 = unlimited
const out = option("out", `src/data/words.${lang}.json`);

// Parts of speech we don't want in a learner's dictionary (adjust freely).
const SKIPPED_POS = new Set([
  "name", // proper names
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

// True if a sense is only an inflected form (plural, conjugation, feminine...).
function isFormOf(sense) {
  const tags = sense.tags ?? [];
  return tags.includes("form-of") || Boolean(sense.form_of) || Boolean(sense.alt_of);
}

// Turns one kaikki line (one word + one part of speech) into one "meaning".
function toMeaning(entry) {
  const definitions = [];
  const examples = [];

  for (const sense of entry.senses ?? []) {
    if (isFormOf(sense)) continue;

    const glosses = sense.glosses ?? [];
    if (glosses.length === 0) continue;

    // glosses is a list; for sub-senses the last item is the most specific.
    definitions.push(glosses[glosses.length - 1]);

    for (const ex of sense.examples ?? []) {
      if (ex.text && examples.length < MAX_EXAMPLES_PER_MEANING) {
        examples.push(ex.text);
      }
    }
  }

  if (definitions.length === 0) return null;

  const meaning = { partOfSpeech: entry.pos, definitions };
  if (examples.length > 0) meaning.examples = examples;
  return meaning;
}

// ---------- main ----------
const words = new Map(); // headword -> { id, headword, language, pronunciation?, meanings[] }
let linesRead = 0;
let skippedBadJson = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(input, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.trim()) continue;
  linesRead++;

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

  let word = words.get(entry.word);

  if (!word) {
    // New headword: stop here if we've reached the limit.
    if (limit > 0 && words.size >= limit) break;

    word = {
      id: `${lang}:${entry.word}`,
      headword: entry.word,
      language: lang,
      meanings: [],
    };
    words.set(entry.word, word);
  }

  // Keep the first pronunciation we find.
  if (!word.pronunciation) {
    const ipa = (entry.sounds ?? []).find((s) => s.ipa)?.ipa;
    if (ipa) word.pronunciation = ipa;
  }

  word.meanings.push(meaning);
}

rl.close();

const result = [...words.values()];
// Pretty-print small test files, compact for the full dictionary.
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, limit > 0 ? 2 : 0));

console.log(`Lines read:      ${linesRead}`);
console.log(`Bad JSON lines:  ${skippedBadJson}`);
console.log(`Words written:   ${result.length}`);
console.log(`Output:          ${out}`);
