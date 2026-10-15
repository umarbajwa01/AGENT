import mongoose from "mongoose";
export async function initialize() {
  for (const m of Object.values(mongoose.models)) await m.init();
}
