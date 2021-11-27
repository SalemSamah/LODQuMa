import mongoose from "mongoose";
import { RDFStoreSchema } from "./RDFStore";

const Synonyms = new mongoose.Schema({
  value: String,
  RDFStore: {
    type: [
      {
        type: RDFStoreSchema,
      },
    ],
  },
});

export { Synonyms };
