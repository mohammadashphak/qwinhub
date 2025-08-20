"use client";

import React, { useState } from "react";
import Link from "next/link";
import { isQuizActive, formatDeadline } from "@/lib/utils";

type Quiz = {
  id: string;
  slug: string;
  title: string;
  options: string[];
  correctAnswer: string;
  deadline: string | Date;
  _count?: { responses: number };
  winner?: { name: string; phone: string } | null;
};

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [navigating, setNavigating] = useState<"edit" | "responses" | null>(null);
  const active = isQuizActive(new Date(quiz.deadline as any));

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{quiz.title}</h3>
          <div className="text-sm text-gray-600">
            Deadline: {formatDeadline(
              typeof quiz.deadline === "string" ? new Date(quiz.deadline) : quiz.deadline,
              true
            )}
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
              {active ? 'Active' : 'Expired'}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">{quiz._count?.responses ?? 0} responses</div>
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Options</div>
        <ul className="list-disc pl-5 text-sm text-gray-800">
          {quiz.options.map((opt) => (
            <li key={opt}>{opt}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAnswer((s) => !s)}
          className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50"
        >
          {showAnswer ? 'Hide Correct Answer' : 'Show Correct Answer'}
        </button>
        {showAnswer && (
          <span className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {quiz.correctAnswer}
          </span>
        )}

        {/* Winner (admin sees full) — show button for all expired; disable if missing winner */}
        {!active && (
          <>
            <button
              type="button"
              onClick={() => setShowWinner((s) => !s)}
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
              disabled={!quiz.winner}
              aria-disabled={!quiz.winner}
              title={!quiz.winner ? 'Winner not declared' : undefined}
            >
              {showWinner ? 'Hide Winner' : 'Show Winner'}
            </button>
            {showWinner && quiz.winner && (
              <span className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-green-50 text-green-700 border border-green-200">
                {quiz.winner.name} · {quiz.winner.phone}
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Link
          href={`/admin/quiz/${quiz.slug}/edit`}
          onClick={() => setNavigating("edit")}
          aria-busy={navigating === "edit"}
          className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md text-white ${
            navigating === "edit" ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {navigating === "edit" ? "Opening..." : "Edit"}
        </Link>
        <Link
          href={`/admin/quiz/${quiz.slug}/responses`}
          onClick={() => setNavigating("responses")}
          aria-busy={navigating === "responses"}
          className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md border ${
            navigating === "responses" ? "bg-gray-100 text-gray-500 cursor-wait" : "bg-white hover:bg-gray-50"
          }`}
        >
          {navigating === "responses" ? "Opening..." : "View Responses"}
        </Link>
      </div>
    </div>
  );
}
