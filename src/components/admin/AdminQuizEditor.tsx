"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DateTimePicker from "@/components/date-time-picker";
import { isQuizActive } from "@/lib/utils";
import { z } from "zod";

type QuizEditable = {
  slug: string;
  title: string;
  options: string[];
  correctAnswer: string;
  deadline: string | Date;
};

// Client-side schema mirrors create-quiz constraints; deadline remains a string here and is converted to ISO before send
const clientQuizUpdateSchema = z
  .object({
    title: z.string().min(1, "Quiz title is required").max(200, "Title too long"),
    options: z
      .array(z.string().trim().min(1, "Option cannot be empty").max(60, "Option too long"))
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options allowed")
      .refine((opts) => new Set(opts.map((o) => o.toLowerCase())).size === opts.length, {
        message: "All options must be unique",
      }),
    correctAnswer: z.string().min(1, "Select a correct answer"),
    deadline: z.string().min(1, "Deadline is required"), // will be ISO before sending
  })
  .refine((data) => data.options.includes(data.correctAnswer), {
    message: "Correct answer must match one of the options",
    path: ["correctAnswer"],
  });

export default function AdminQuizEditor({ quiz }: { quiz: QuizEditable }) {
  const router = useRouter();
  const [title, setTitle] = useState(quiz.title);
  const [options, setOptions] = useState<string[]>(quiz.options);
  const [correctAnswer, setCorrectAnswer] = useState(quiz.correctAnswer);
  
  // Ensure deadline is shown in LOCAL time for the editor (not UTC ISO)
  function toLocalInputValue(input: string | Date): string {
    const d = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    // datetime-local format without timezone: YYYY-MM-DDTHH:mm
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const [deadline, setDeadline] = useState<string>(() => toLocalInputValue(quiz.deadline));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const active = isQuizActive(new Date(deadline));

  useEffect(() => {
    // Ensure correctAnswer is valid when options change
    if (!options.includes(correctAnswer)) {
      setCorrectAnswer("");
    }
  }, [options]);

  function updateOption(idx: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function addOption() {
    setOptions((prev) => (prev.length < 6 ? [...prev, ""] : prev));
  }

  function removeOption(idx: number) {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      const removed = prev[idx];
      const next = prev.filter((_, i) => i !== idx);
      if (removed === correctAnswer) setCorrectAnswer("");
      return next;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Build payload and validate with Zod (mirrors create-quiz)
    const payload = {
      title: title.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer: correctAnswer.trim(),
      // Convert local datetime-local string to ISO to avoid timezone ambiguity
      deadline: deadline ? new Date(deadline).toISOString() : "",
    };

    const parsed = clientQuizUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      // Surface the first validation error succinctly
      const first = parsed.error.issues[0];
      setError(first?.message || "Validation failed");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/quiz/${quiz.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Use parsed, normalized values; deadline is ISO instant
          title: parsed.data.title,
          options: parsed.data.options,
          correctAnswer: parsed.data.correctAnswer,
          deadline: parsed.data.deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If slug/title conflict, surface the same message as create
        if (res.status === 409) {
          setError(data?.message || "A quiz with this title already exists. Please choose a different title.");
        } else {
          setError(data?.message || "Failed to save changes");
        }
        return;
      }
      setSuccess("Quiz updated successfully");
      // If slug changed due to title update, navigate to the new slug route
      const newSlug: string | undefined = data?.data?.quiz?.slug;
      if (newSlug && newSlug !== quiz.slug) {
        router.replace(`/admin/quiz/${newSlug}/edit`);
        return;
      }
      // Invalidate caches so going back shows fresh data
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setError(null);
    setSuccess(null);
    const ok = window.confirm("Are you sure you want to delete this quiz? This will permanently remove the quiz and all its responses.");
    if (!ok) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/quiz/${quiz.slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Failed to delete quiz");
        return;
      }
      // Navigate back to quizzes list
      router.push("/admin/quizzes");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Slug: {quiz.slug}</div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
              {active ? 'Active' : 'Expired'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete Quiz"}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700">{success}</div>}

      <form onSubmit={onSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Options</label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
                  disabled={options.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50"
              disabled={options.length >= 6}
            >
              Add option
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Correct Answer</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          >
            <option value="" disabled>
              -- Choose option --
            </option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt} disabled={!opt.trim()}>
                {opt || `Option ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <DateTimePicker value={deadline} onChange={setDeadline} placeholder="Pick date & time" />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/quizzes")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border bg-white hover:bg-gray-50"
          >
            Back to Quizzes
          </button>
        </div>
      </form>
    </div>
  );
}
