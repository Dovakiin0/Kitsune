import Pocketbase from "pocketbase";

export const pb = new Pocketbase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://localhost:8090",
);
