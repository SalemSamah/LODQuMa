import mongoose from "mongoose";

const RDFStoreSchema = new mongoose.Schema({
  subject: {
    type: {
      termType: String,
      value: String,
    },
    required: true,
  },
  object: {
    type: {
      termType: String,
      value: String,
    },
    required: true,
  },
  predicate: {
    type: {
      termType: String,
      value: String,
    },
    required: true,
  },
});

export { RDFStoreSchema };
