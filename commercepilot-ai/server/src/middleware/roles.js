import { staff } from "./auth.js";
export const admin = staff("ADMIN");
export const team = staff("ADMIN", "SALES_AGENT");
