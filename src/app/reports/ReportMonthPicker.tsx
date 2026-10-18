"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ReportMonthPicker({
  month,
  day,
}: {
  month: string;
  day: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`/reports?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label className="flex-1">
        <span className="text-xs text-[var(--text-muted)]">Month analysis</span>
        <input
          type="month"
          defaultValue={month}
          className="input-text mt-1"
          onChange={(e) => set("month", e.target.value)}
        />
      </label>
      <label className="flex-1">
        <span className="text-xs text-[var(--text-muted)]">Daily report</span>
        <input
          type="date"
          defaultValue={day}
          className="input-text mt-1"
          onChange={(e) => set("day", e.target.value)}
        />
      </label>
    </div>
  );
}
