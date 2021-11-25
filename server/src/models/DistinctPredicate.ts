import mongoose from "mongoose";

const DistinctPredicate = new mongoose.Schema({
  value: String,
  dic: {
    type: [
      {
        type: String,
      },
    ],
  },
});

export { DistinctPredicate };
