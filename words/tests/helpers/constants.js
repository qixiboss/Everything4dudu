// Corpus invariants shared by the data and learning-progress tests.

const CORPUS_SET_COUNT = 7;
const CORPUS_COLUMN_COUNT = 28;
const CORPUS_OCCURRENCE_COUNT = 897;
const CORPUS_ENTRY_COUNT = 892;

// Manual synonym pair (check-integrity.js asserts the alias resolution).
const RADIATE_PRIMARY_ID = 's1col1-radiate';
const RADIATE_ALIAS_ID = 's6col2-radiate';

module.exports = {
  CORPUS_SET_COUNT,
  CORPUS_COLUMN_COUNT,
  CORPUS_OCCURRENCE_COUNT,
  CORPUS_ENTRY_COUNT,
  RADIATE_PRIMARY_ID,
  RADIATE_ALIAS_ID
};
