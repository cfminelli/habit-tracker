"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { DayRecord } from "@/lib/storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRecord(date: string): DayRecord {
  return {
    date,
    exercise: { done: false },
    food: { rating: 0 },
    reading: { done: false },
    sleep: { hours: 7 },
    study: { done: false },
    writing: { done: false },
    water: { glasses: 0 },
  };
}

function formatDatePTBR(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const TODAY = localDateString(new Date());

// ─── Streak & stats helpers ───────────────────────────────────────────────────

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

function calcStreak(
  records: DayRecord[],
  isDone: (r: DayRecord) => boolean
): { streak: number; atRisk: boolean } {
  const todayRec = records.find((r) => r.date === TODAY);
  const todayDone = todayRec ? isDone(todayRec) : false;

  // Walk backwards from today (if done) or yesterday (if not yet done)
  let streak = 0;
  let cursor = todayDone ? TODAY : prevDay(TODAY);

  while (true) {
    const rec = records.find((r) => r.date === cursor);
    if (!rec || !isDone(rec)) break;
    streak++;
    cursor = prevDay(cursor);
  }

  return { streak, atRisk: streak >= 2 && !todayDone };
}

function avgSleepLastWeek(records: DayRecord[]): number | null {
  const cutoff = new Date(TODAY + "T12:00:00");
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = localDateString(cutoff);
  const relevant = records.filter((r) => r.date >= cutoffStr && r.date <= TODAY);
  if (relevant.length === 0) return null;
  const sum = relevant.reduce((acc, r) => acc + r.sleep.hours, 0);
  return Math.round((sum / relevant.length) * 10) / 10;
}

function writingDaysThisMonth(records: DayRecord[]): number {
  const firstOfMonth = TODAY.slice(0, 8) + "01";
  return records.filter(
    (r) => r.date >= firstOfMonth && r.date <= TODAY && r.writing.done
  ).length;
}

function currentMonthName(): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  value,
  label,
  warning,
}: {
  value: string;
  label: string;
  warning?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1.5">{label}</p>
      {warning && (
        <p className="text-xs text-amber-600 mt-2 leading-snug">{warning}</p>
      )}
    </div>
  );
}

function StatsSection({ records }: { records: DayRecord[] }) {
  const exercise = calcStreak(records, (r) => r.exercise.done);
  const reading = calcStreak(records, (r) => r.reading.done);
  const avgSleep = avgSleepLastWeek(records);
  const writingDays = writingDaysThisMonth(records);

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <MetricCard
        value={String(exercise.streak)}
        label="dias seguidos de exercício"
        warning={
          exercise.atRisk
            ? `${exercise.streak} dias 🔥 — não quebre hoje`
            : undefined
        }
      />
      <MetricCard
        value={String(reading.streak)}
        label="dias seguidos de leitura"
        warning={
          reading.atRisk
            ? `${reading.streak} dias 🔥 — não quebre hoje`
            : undefined
        }
      />
      <MetricCard
        value={avgSleep !== null ? `${avgSleep}h` : "—"}
        label="média de sono (7 dias)"
      />
      <MetricCard
        value={String(writingDays)}
        label={`dias de escrita em ${currentMonthName()}`}
      />
    </div>
  );
}

function Card({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-600 mb-3">
        {emoji} {title}
      </h2>
      {children}
    </div>
  );
}

function ToggleButton({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          value ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        Sim
      </button>
      <button
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !value ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        Não
      </button>
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          className={`text-2xl leading-none transition-colors ${
            star <= value ? "text-amber-400" : "text-gray-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function MinutesInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={600}
        placeholder="minutos"
        value={value ?? ""}
        onChange={(e) => {
          const n = parseInt(e.target.value);
          onChange(isNaN(n) ? undefined : n);
        }}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white w-28 focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <span className="text-sm text-gray-400">min</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [dayRecord, setDayRecord] = useState<DayRecord>(defaultRecord(TODAY));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [allRecords, setAllRecords] = useState<DayRecord[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all records on mount
  useEffect(() => {
    fetch("/api/habits?period=all")
      .then((res) => res.json())
      .then((records: DayRecord[]) => {
        setAllRecords(records);
      });
  }, []);

  // Sync dayRecord when date or allRecords change
  useEffect(() => {
    isDirtyRef.current = false;
    const found = allRecords.find((r) => r.date === selectedDate);
    setDayRecord(found ?? defaultRecord(selectedDate));
  }, [selectedDate, allRecords]);

  // Debounced save
  useEffect(() => {
    if (!isDirtyRef.current) return;

    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dayRecord),
      });

      isDirtyRef.current = false;

      setAllRecords((prev) => {
        const idx = prev.findIndex((r) => r.date === dayRecord.date);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = dayRecord;
          return updated;
        }
        return [...prev, dayRecord];
      });

      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dayRecord]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateRecord<K extends keyof DayRecord>(
    key: K,
    value: DayRecord[K]
  ) {
    isDirtyRef.current = true;
    setDayRecord((prev) => ({ ...prev, [key]: value }));
  }

  function goBack() {
    setSelectedDate((prev) => {
      const d = new Date(prev + "T12:00:00");
      d.setDate(d.getDate() - 1);
      return localDateString(d);
    });
  }

  function goForward() {
    setSelectedDate((prev) => {
      if (prev >= TODAY) return prev;
      const d = new Date(prev + "T12:00:00");
      d.setDate(d.getDate() + 1);
      return localDateString(d);
    });
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "saved"
      ? "Salvo ✓"
      : "\u00a0";

  const { exercise, food, reading, sleep, study, writing, water } = dayRecord;

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* ── Nav ── */}
        <nav className="flex justify-end mb-5">
          <Link
            href="/semana"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Semana →
          </Link>
        </nav>

        {/* ── Streaks & stats ── */}
        <StatsSection records={allRecords} />

        {/* ── Date header ── */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-500 text-lg"
            aria-label="Dia anterior"
          >
            ←
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {formatDatePTBR(selectedDate)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 h-4">{saveLabel}</p>
          </div>

          <button
            onClick={goForward}
            disabled={selectedDate >= TODAY}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-500 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximo dia"
          >
            →
          </button>
        </header>

        {/* ── Habit cards ── */}
        <div className="flex flex-col gap-4">

          {/* 1. Exercício */}
          <Card emoji="🏋️" title="Exercício">
            <ToggleButton
              value={exercise.done}
              onChange={(v) =>
                updateRecord("exercise", { ...exercise, done: v })
              }
            />
            {exercise.done && (
              <div className="mt-3 flex flex-col gap-2">
                <select
                  value={exercise.type ?? "musculação"}
                  onChange={(e) =>
                    updateRecord("exercise", {
                      ...exercise,
                      type: e.target.value,
                    })
                  }
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white w-full focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="musculação">Musculação</option>
                  <option value="corrida">Corrida</option>
                  <option value="caminhada">Caminhada</option>
                  <option value="yoga">Yoga</option>
                </select>
                <MinutesInput
                  value={exercise.minutes}
                  onChange={(v) =>
                    updateRecord("exercise", { ...exercise, minutes: v })
                  }
                />
              </div>
            )}
          </Card>

          {/* 2. Alimentação */}
          <Card emoji="🥗" title="Alimentação">
            <StarRating
              value={food.rating}
              onChange={(v) => updateRecord("food", { rating: v })}
            />
          </Card>

          {/* 3. Leitura */}
          <Card emoji="📖" title="Leitura">
            <ToggleButton
              value={reading.done}
              onChange={(v) =>
                updateRecord("reading", { ...reading, done: v })
              }
            />
            {reading.done && (
              <div className="mt-3">
                <MinutesInput
                  value={reading.minutes}
                  onChange={(v) =>
                    updateRecord("reading", { ...reading, minutes: v })
                  }
                />
              </div>
            )}
          </Card>

          {/* 4. Sono */}
          <Card emoji="😴" title="Sono">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">4h</span>
                <span className="text-base font-bold text-slate-700">
                  {sleep.hours}h
                </span>
                <span className="text-xs text-gray-400">10h</span>
              </div>
              <input
                type="range"
                min={4}
                max={10}
                step={0.5}
                value={sleep.hours}
                onChange={(e) =>
                  updateRecord("sleep", { hours: parseFloat(e.target.value) })
                }
              />
            </div>
          </Card>

          {/* 5. Estudos */}
          <Card emoji="📚" title="Estudos">
            <ToggleButton
              value={study.done}
              onChange={(v) => updateRecord("study", { ...study, done: v })}
            />
            {study.done && (
              <div className="mt-3">
                <MinutesInput
                  value={study.minutes}
                  onChange={(v) =>
                    updateRecord("study", { ...study, minutes: v })
                  }
                />
              </div>
            )}
          </Card>

          {/* 6. Escrita */}
          <Card emoji="✍️" title="Escrita">
            <ToggleButton
              value={writing.done}
              onChange={(v) => updateRecord("writing", { done: v })}
            />
          </Card>

          {/* 7. Água */}
          <Card emoji="💧" title="Água">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  updateRecord("water", {
                    glasses: Math.max(0, water.glasses - 1),
                  })
                }
                disabled={water.glasses === 0}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Remover copo"
              >
                −
              </button>
              <span className="text-2xl font-bold text-slate-700 w-8 text-center tabular-nums">
                {water.glasses}
              </span>
              <button
                onClick={() =>
                  updateRecord("water", { glasses: water.glasses + 1 })
                }
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center hover:bg-gray-200 transition-colors"
                aria-label="Adicionar copo"
              >
                +
              </button>
              <span className="text-sm text-gray-400">
                {water.glasses === 1 ? "copo" : "copos"}
              </span>
            </div>
          </Card>

        </div>
      </div>
    </main>
  );
}
