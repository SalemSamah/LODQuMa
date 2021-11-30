import mongoose, { Schema } from "mongoose";

const QVCSchema = (ref: string) =>
  new mongoose.Schema({
    triple01: { type: Schema.Types.ObjectId, ref: ref, required: true },
    triple02: { type: Schema.Types.ObjectId, ref: ref, required: true },
  });

export { QVCSchema };
