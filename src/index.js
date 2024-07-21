#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";
import minimist from "minimist";
import sqlite3 from "sqlite3";
import WordDB from "./word_db.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const dbPath = dirname + "/../db/wnjpn.db";

const db = new sqlite3.Database(dbPath);
const argv = minimist(process.argv.slice(2));

if (argv._.length === 0) {
  console.log('usage: synja "word" [-j]');
  process.exit(0);
}

const wordDB = new WordDB(db);
const wordID = await wordDB.wordID(argv._[0]);
const synsetWords = await wordDB.synsetWords(wordID);
const synonyms = await wordDB.synonyms(synsetWords, wordID);

const synonymObjs = synsetWords.map((synsetWord, idx) => {
  return {
    ...synsetWord,
    synonyms: synonyms[idx].map((synonymLemma) => synonymLemma.lemma),
  };
});

if (argv.j) {
  console.log(JSON.stringify(synonymObjs));
} else {
  synonymObjs.forEach(({ name, def, synonyms }) => {
    console.log(`概念: ${name}`);
    console.log(`定義: ${def}`);
    synonyms.forEach((synonym) => {
      console.log(`類義語: ${synonym}`);
    });
    console.log();
  });
}
