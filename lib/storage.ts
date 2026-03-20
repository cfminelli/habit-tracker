import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

export type DayRecord = {
  date: string; // "YYYY-MM-DD"
  exercise: { done: boolean; type?: string; minutes?: number };
  food: { rating: number };
  reading: { done: boolean; minutes?: number };
  sleep: { hours: number };
  study: { done: boolean; minutes?: number };
  writing: { done: boolean };
  water: { glasses: number };
};

export type HabitsDB = DayRecord[];

const KV_KEY = "habits";

// Vercel may set either UPSTASH_* (Marketplace integration) or
// KV_REST_API_* (Storage tab). Support both.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const USE_KV = !!(REDIS_URL && REDIS_TOKEN);

// ─── File-system backend (development) ───────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "data", "habits.json");

function readFile(): HabitsDB {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as HabitsDB;
}

function writeFile(data: HabitsDB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Upstash Redis backend (production) ──────────────────────────────────────

function getRedis(): Redis {
  return new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! });
}

async function readKV(): Promise<HabitsDB> {
  return (await getRedis().get<HabitsDB>(KV_KEY)) ?? [];
}

async function writeKV(data: HabitsDB): Promise<void> {
  await getRedis().set(KV_KEY, data);
}

// ─── Unified API ─────────────────────────────────────────────────────────────

async function readData(): Promise<HabitsDB> {
  return USE_KV ? readKV() : readFile();
}

async function saveData(data: HabitsDB): Promise<void> {
  if (USE_KV) {
    await writeKV(data);
  } else {
    writeFile(data);
  }
}

export async function addDayRecord(record: DayRecord): Promise<DayRecord> {
  const data = await readData();
  const idx = data.findIndex((r) => r.date === record.date);

  if (idx !== -1) {
    data[idx] = record;
  } else {
    data.push(record);
  }

  data.sort((a, b) => a.date.localeCompare(b.date));
  await saveData(data);
  return record;
}

export async function getByPeriod(
  period: "week" | "month" | "all"
): Promise<HabitsDB> {
  const data = await readData();

  if (period === "all") return data;

  const now = new Date();
  const cutoff = new Date(now);

  if (period === "week") {
    cutoff.setDate(now.getDate() - 7);
  } else {
    cutoff.setDate(now.getDate() - 30);
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((r) => r.date >= cutoffStr);
}
