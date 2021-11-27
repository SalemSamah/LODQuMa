import mongoose from "mongoose";

const DistinctPredicateStore = new mongoose.Schema({
  domain: String,
  predicates: {
    type: [
      {
        type: String,
      },
    ],
  },
});

export { DistinctPredicateStore };
