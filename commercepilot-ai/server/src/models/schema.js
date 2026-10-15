import mongoose from "mongoose";
export const { Schema } = mongoose;
export const id = Schema.Types.ObjectId;
export const model = (name, fields, indexes = []) => {
  const s = new Schema(fields, {
    timestamps: true,
    strict: "throw",
  });
  for (const [keys, opts] of indexes) s.index(keys, opts);
  return mongoose.model(name, s);
};
export const money = {
  type: Number,
  min: 0,
  validate: Number.isSafeInteger,
};
