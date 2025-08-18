"use client";

import React, { useState } from "react";
import Link from "next/link";
import { isQuizActive, formatDeadline } from "@/lib/utils";

export type PublicQuiz = {
  id: string;
  slug: string;
  title: string;
  options: string[];
  // correctAnswer will be null for active quizzes (privacy); available for expired
  correctAnswer: string | null;
  deadline: string | Date;
};

export default function PublicQuizCard({ quiz }: { quiz: PublicQuiz }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const deadlineDate = typeof quiz.deadline === "string" ? new Date(quiz.deadline) : quiz.deadline;
  const active = isQuizActive(deadlineDate);

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
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Options</div>
        <ul className="list-disc pl-5 text-sm text-gray-800">
          {quiz.options.map((opt) => (
            <li key={opt}>{opt}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {active ? (
        <div className="mt-1">
          <Link
            href={`/quiz/${quiz.slug}`}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Answer Now
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAnswer((s) => !s)}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-60"
            disabled={!quiz.correctAnswer}
            aria-disabled={!quiz.correctAnswer}
            title={!quiz.correctAnswer ? 'Answer unavailable' : undefined}
          >
            {showAnswer ? 'Hide Correct Answer' : 'Show Correct Answer'}
          </button>
          {showAnswer && quiz.correctAnswer && (
            <span className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {quiz.correctAnswer}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
