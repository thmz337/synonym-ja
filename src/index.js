#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";
import minimist from "minimist";
import sqlite3 from "sqlite3";
import { get, all } from "./node_sqlite3_wrapper.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const dbPath = dirname + "/../db/wnjpn.db";

const db = new sqlite3.Database(dbPath);
const argv = minimist(process.argv.slice(2));

if (argv._.length === 0) {
  console.log('usage: synja "word" [-j]');
  process.exit(0);
}

const wordIDObject = await get(
  db,
  "SELECT wordid FROM word WHERE lemma = ?",
  argv._[0],
);

const wordID = wordIDObject["wordid"];

const synsets = await all(
  db,
  "SELECT synset FROM sense WHERE wordid = ?",
  wordID,
);

const synsetWords = await Promise.all(
  synsets.map((synset) => {
    return getWordFromSynset(synset);
  }),
);

const synonymsIDs = await Promise.all(
  synsetWords.map((synsetWord) => getSynonyms(synsetWord["synset"], wordID)),
);

const synonyms = await Promise.all(
  synonymsIDs.map(
    async (synonym) =>
      await Promise.all(synonym.map((wordID) => getWordFromID(wordID))),
  ),
);

const synonymObjs = synsetWords.map((synsetWord, idx) => {
  return {
    ...synsetWord,
    synonyms: synonyms[idx].map((synonymLemma) => synonymLemma.lemma),
  };
});

if (argv.j) {
  console.log(JSON.stringify(synonymObjs));
} else {
  synonymObjs.forEach((obj) => {
    console.log(`概念: ${obj.name}`);
    console.log(`定義: ${obj.def}`);
    obj.synonyms.forEach((synonym) => {
      console.log(`類義語: ${synonym}`);
    });
    console.log();
  });
}

async function getWordFromSynset(synSet) {
  const syn = await get(
    db,
    "SELECT name FROM synset WHERE synset = ?",
    synSet["synset"],
  );
  const def = await get(
    db,
    "SELECT def FROM synset_def WHERE (synset = ? and lang = 'jpn')",
    synSet["synset"],
  );

  return { ...synSet, ...syn, ...def };
}

async function getSynonyms(synSetWord, wordID) {
  const synonyms = await all(
    db,
    "SELECT wordid FROM sense WHERE (synset = $synset AND wordid != $wordid)",
    { $synset: synSetWord, $wordid: wordID },
  );

  return synonyms.map(({ wordid }) => wordid);
}

async function getWordFromID(wordID) {
  return await get(db, "SELECT lemma FROM word WHERE wordid = ?", wordID);
}
