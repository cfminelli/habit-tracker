"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DayRecord } from "@/lib/storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TODAY = localDateString(new Date());

// Returns Mon–Sun dates for the week at `offset` weeks from current
function getWeekDates(weekOffset: number): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Dom … 6=Sáb
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateString(d);
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatWeekLabel(dates: string[]): string {
  const first = new Date(dates[0] + "T12:00:00");
  const last = new Date(dates[6] + "T12:00:00");
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} de ${months[first.getMonth()]} de ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]} de ${last.getFullYear()}`;
}

function foodColor(rating: number): string {
  if (rating >= 4) return "text-green-600";
  if (rating === 3) return "text-amber-500";
  return "text-red-500";
}

function sleepColor(hours: number): string {
  if (hours >= 7) return "text-green-600";
  if (hours >= 6) return "text-amber-500";
  return "text-red-500";
}

function pctColor(pct: number): string {
  if (pct >= 70) return "text-green-600";
  if (pct >= 40) return "text-amber-500";
  return "text-gray-400";
}

// ─── Habit definitions ────────────────────────────────────────────────────────

type CellData = { record: DayRecord | undefined; inDB: boolean };

type HabitDef = {
  key: string;
  emoji: string;
  label: string;
  cell: (c: CellData) => React.ReactNode;
  isDone: (c: CellData) => boolean;
};

const HABITS: HabitDef[] = [
  {
    key: "exercise",
    emoji: "🏋️",
    label: "Exercício",
    cell: ({ record }) => (record?.exercise.done ? "✅" : "⬜"),
    isDone: ({ record }) => record?.exercise.done === true,
  },
  {
    key: "food",
    emoji: "🥗",
    label: "Alimentação",
    cell: ({ record }) => {
      const r = record?.food.rating ?? 0;
      if (r === 0) return <span className="text-gray-300">—</span>;
      return <span className={`font-semibold ${foodColor(r)}`}>{r}</span>;
    },
    isDone: ({ record }) => (record?.food.rating ?? 0) > 0,
  },
  {
    key: "reading",
    emoji: "📖",
    label: "Leitura",
    cell: ({ record }) => {
      if (!record?.reading.done) return "⬜";
      const min = record.reading.minutes;
      return min ? (
        <span className="text-slate-700 font-medium">{min}m</span>
      ) : (
        "✅"
      );
    },
    isDone: ({ record }) => record?.reading.done === true,
  },
  {
    key: "sleep",
    emoji: "😴",
    label: "Sono",
    cell: ({ record, inDB }) => {
      if (!inDB || !record) return <span className="text-gray-300">—</span>;
      const h = record.sleep.hours;
      return <span className={`font-semibold ${sleepColor(h)}`}>{h}h</span>;
    },
    isDone: ({ inDB }) => inDB,
  },
  {
    key: "study",
    emoji: "📚",
    label: "Estudos",
    cell: ({ record }) => {
      if (!record?.study.done) return "⬜";
      const min = record.study.minutes;
      return min ? (
        <span className="text-slate-700 font-medium">{min}m</span>
      ) : (
        "✅"
      );
    },
    isDone: ({ record }) => record?.study.done === true,
  },
  {
    key: "writing",
    emoji: "✍️",
    label: "Escrita",
    cell: ({ record }) => (record?.writing.done ? "✅" : "⬜"),
    isDone: ({ record }) => record?.writing.done === true,
  },
  {
    key: "water",
    emoji: "💧",
    label: "Água",
    cell: ({ record }) => {
      const g = record?.water.glasses ?? 0;
      return g === 0 ? (
        <span className="text-gray-300">0</span>
      ) : (
        <span className="text-slate-700 font-medium">{g}</span>
      );
    },
    isDone: ({ record }) => (record?.water.glasses ?? 0) > 0,
  },
];

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SemanaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [allRecords, setAllRecords] = useState<DayRecord[]>([]);

  useEffect(() => {
    fetch("/api/habits?period=all")
      .then((r) => r.json())
      .then(setAllRecords);
  }, []);

  const weekDates = getWeekDates(weekOffset);

  function getCellData(date: string): CellData {
    const found = allRecords.find((r) => r.date === date);
    return { record: found, inDB: !!found };
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── Nav ── */}
        <nav className="mb-5">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Hoje
          </Link>
        </nav>

        {/* ── Week header ── */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-500 text-lg"
            aria-label="Semana anterior"
          >
            ←
          </button>

          <p className="text-sm font-semibold text-gray-700">
            {formatWeekLabel(weekDates)}
          </p>

          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={weekOffset >= 0}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-500 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próxima semana"
          >
            →
          </button>
        </header>

        {/* ── Grid ── */}
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {/* Habit label column */}
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">
                  Hábito
                </th>
                {/* Day columns */}
                {DAY_LABELS.map((label, i) => {
                  const isToday = weekDates[i] === TODAY;
                  const isFuture = weekDates[i] > TODAY;
                  return (
                    <th
                      key={i}
                      className={`text-center py-3 px-2 min-w-[3rem] ${
                        isToday
                          ? "text-slate-700"
                          : isFuture
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      <div className="text-xs font-semibold">{label}</div>
                      <div
                        className={`text-xs mt-0.5 tabular-nums ${
                          isToday ? "font-bold" : "font-normal"
                        }`}
                      >
                        {formatShortDate(weekDates[i])}
                      </div>
                    </th>
                  );
                })}
                {/* Completion % column */}
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">
                  %
                </th>
              </tr>
            </thead>

            <tbody>
              {HABITS.map((habit, hi) => {
                const cells = weekDates.map(getCellData);
                const doneCount = cells.filter((c) => habit.isDone(c)).length;
                const pct = Math.round((doneCount / 7) * 100);
                const isLast = hi === HABITS.length - 1;

                return (
                  <tr
                    key={habit.key}
                    className={!isLast ? "border-b border-gray-50" : ""}
                  >
                    {/* Habit label */}
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="mr-1">{habit.emoji}</span>
                      <span className="font-medium">{habit.label}</span>
                    </td>

                    {/* Day cells */}
                    {cells.map((cellData, di) => {
                      const isFuture = weekDates[di] > TODAY;
                      const isToday = weekDates[di] === TODAY;
                      return (
                        <td
                          key={di}
                          className={`text-center py-3 px-2 text-sm ${
                            isToday ? "bg-slate-50" : ""
                          } ${isFuture ? "opacity-30" : ""}`}
                        >
                          {habit.cell(cellData)}
                        </td>
                      );
                    })}

                    {/* Completion % */}
                    <td className="text-right py-3 px-4 whitespace-nowrap">
                      <span className={`text-xs font-bold ${pctColor(pct)}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
