import { NextRequest, NextResponse } from "next/server";
import { addDayRecord, getByPeriod, DayRecord } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") ?? "all";

  if (period !== "week" && period !== "month" && period !== "all") {
    return NextResponse.json(
      { error: 'Invalid period. Use "week", "month" or "all".' },
      { status: 400 }
    );
  }

  const records = await getByPeriod(period);
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = body as Partial<DayRecord>;

  if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    return NextResponse.json(
      { error: 'Field "date" is required and must be in YYYY-MM-DD format.' },
      { status: 400 }
    );
  }

  const saved = await addDayRecord(record as DayRecord);
  return NextResponse.json(saved, { status: 201 });
}
