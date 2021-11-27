import mongoose from "mongoose";

const DictionaryPredicate = new mongoose.Schema({
  value: String,
  synonyms: {
    type: [
      {
        type: String,
      },
    ],
  },
  isUsed: Boolean,
});

export { DictionaryPredicate };
