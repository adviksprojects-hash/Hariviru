export { cn } from "cn";

export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return Number(val).toLocaleString("en-IN");
}
