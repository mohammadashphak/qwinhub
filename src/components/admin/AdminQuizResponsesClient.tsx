"use client";

import React, { useMemo, useState } from "react";

type QuizMeta = { title: string; slug: string; winner?: { name: string; phone: string } | null };

type Stats = { total: number; correct: number; wrong: number };

type ResponseRow = {
  id: string;
  name: string;
  phone: string;
  answer: string;
  isCorrect: boolean;
  submittedAt: string; // ISO string
};

export default function AdminQuizResponsesClient({
  quiz,
  stats,
  responses,
}: {
  quiz: QuizMeta;
  stats: Stats;
  responses: ResponseRow[];
}) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");

  // Deterministic date formatter to avoid SSR/CSR hydration mismatch
  const formatDateUTC = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(d);

  const filtered = useMemo(() => {
    if (filter === "correct") return responses.filter((r) => r.isCorrect);
    if (filter === "wrong") return responses.filter((r) => !r.isCorrect);
    return responses;
  }, [responses, filter]);

  const correctRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <>
      {/* Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={stats.total} />
        <Stat label="Correct" value={stats.correct} />
        <Stat label="Wrong" value={stats.wrong} />
        <Stat label="Accuracy" value={`${correctRate}%`} />
      </div>

      {/* Winner details (admin sees full phone) */}
      {quiz.winner && (
        <div className="mb-4 rounded-lg border bg-white p-4 flex items-center gap-3">
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Winner</div>
          <div className="text-sm text-gray-800">{quiz.winner.name} · {quiz.winner.phone}</div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex items-center gap-2">
        <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterButton label="Correct" active={filter === "correct"} onClick={() => setFilter("correct")} />
        <FilterButton label="Wrong" active={filter === "wrong"} onClick={() => setFilter("wrong")} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600">No responses found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Answer</Th>
                <Th>Status</Th>
                <Th>Submitted At</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <Td>{r.name}</Td>
                  <Td>{r.phone}</Td>
                  <Td>{r.answer}</Td>
                  <Td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        r.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.isCorrect ? "Correct" : "Wrong"}
                    </span>
                  </Td>
                  <Td>{formatDateUTC(new Date(r.submittedAt))}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md border ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{children}</td>;
}
