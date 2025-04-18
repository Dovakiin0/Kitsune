import { env } from "next-runtime-env";
import Pocketbase from "pocketbase";

export const pb = new Pocketbase(env("NEXT_PUBLIC_POCKETBASE_URL"));
