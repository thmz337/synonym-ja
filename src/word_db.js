import { get, all } from "./node_sqlite3_wrapper.js";

export default class WordDB {
  constructor(db) {
    this.db = db;
  }

  async wordID(lemma) {
    const wordIDObject = await get(
      this.db,
      "SELECT wordid FROM word WHERE lemma = ?",
      lemma,
    );
    return wordIDObject["wordid"];
  }

  async synsetWords(wordid) {
    const synsets = await all(
      this.db,
      "SELECT synset FROM sense WHERE wordid = ? ORDER BY synset",
      wordid,
    );

    return await Promise.all(
      synsets.map((synset) => {
        return this.#getWordFromSynset(synset);
      }),
    );
  }

  async synonyms(words, wordid) {
    const synonymsIDs = await Promise.all(
      words.map(({ synset }) => this.#getSynonyms(synset, wordid)),
    );

    return await Promise.all(
      synonymsIDs.map(
        async (synonym) =>
          await Promise.all(
            synonym.map((wordID) => this.#getWordFromID(wordID)),
          ),
      ),
    );
  }

  async #getWordFromSynset(synSet) {
    const syn = await get(
      this.db,
      "SELECT name FROM synset WHERE synset = ?",
      synSet["synset"],
    );
    const def = await get(
      this.db,
      "SELECT def FROM synset_def WHERE (synset = ? and lang = 'jpn')",
      synSet["synset"],
    );

    return { ...synSet, ...syn, ...def };
  }

  async #getSynonyms(synSetWord, wordID) {
    const synonyms = await all(
      this.db,
      "SELECT wordid FROM sense WHERE (synset = $synset AND wordid != $wordid)",
      { $synset: synSetWord, $wordid: wordID },
    );

    return synonyms.map(({ wordid }) => wordid);
  }

  async #getWordFromID(wordID) {
    return await get(
      this.db,
      "SELECT lemma FROM word WHERE wordid = ?",
      wordID,
    );
  }
}
