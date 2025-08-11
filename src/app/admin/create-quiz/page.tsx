"use client";

import React from "react";
import { z } from "zod";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage, createQuizUrl, formatDeadline, copyToClipboard } from "@/lib/utils";
import { replacePlaceholders } from "@/lib/validations";
import DateTimePicker from "@/components/date-time-picker";

// Local client schema mirrors server, but keeps deadline as string for <input type="datetime-local">
const clientQuizSchema = z
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
    deadline: z.string().min(1, "Deadline is required"), // ISO string expected by API
  })
  .refine((data) => data.options.includes(data.correctAnswer), {
    message: "Correct answer must match one of the options",
    path: ["correctAnswer"],
  });

type FormState = z.infer<typeof clientQuizSchema>;

interface Draft {
  type: string;
  subject: string;
  content: string;
}

export default function Page() {
  const [form, setForm] = useState<FormState>({
    title: "",
    options: ["", ""],
    correctAnswer: "",
    deadline: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [shareSubject, setShareSubject] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);

  const updateOption = (idx: number, value: string) => {
    setForm((f) => {
      const next = [...f.options];
      next[idx] = value;
      // If correctAnswer was equal to previous option text, adjust to new text
      const corrected = f.correctAnswer === f.options[idx] ? value : f.correctAnswer;
      return { ...f, options: next, correctAnswer: corrected };
    });
  };

  const addOption = () => {
    setForm((f) => (f.options.length < 6 ? { ...f, options: [...f.options, ""] } : f));
  };

  const removeOption = (idx: number) => {
    setForm((f) => {
      if (f.options.length <= 2) return f;
      const removed = f.options[idx];
      const next = f.options.filter((_, i) => i !== idx);
      const nextCorrect = f.correctAnswer === removed ? "" : f.correctAnswer;
      return { ...f, options: next, correctAnswer: nextCorrect };
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSuccessMsg(null);

    // Normalize options trim
    const payload: FormState = {
      ...form,
      title: form.title.trim(),
      options: form.options.map((o) => o.trim()),
      correctAnswer: form.correctAnswer.trim(),
      // Convert datetime-local to ISO (assume local time then to ISO)
      deadline: form.deadline ? new Date(form.deadline).toISOString() : "",
    };

    const parsed = clientQuizSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setSubmitting(true);
      // Server will re-validate with quizCreateSchema
      const res = await fetch("/api/admin/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to create quiz");
      }

      setSuccessMsg(`Quiz created: ${json?.data?.title} (/${json?.data?.slug})`);

      // Fetch SHARE draft and prepare populated content for copy
      try {
        const draftsRes = await fetch("/api/admin/drafts", { method: "GET" });
        const draftsJson = await draftsRes.json();
        const share = draftsJson?.data?.drafts?.find((d: Draft) => d.type === "SHARE");
        if (share) {
          const placeholders: Record<string, string> = {
            TITLE: json?.data?.title ?? payload.title,
            OPTIONS: payload.options.filter(Boolean).join(", "),
            LINK: createQuizUrl(json?.data?.slug),
            DEADLINE: form.deadline ? formatDeadline(new Date(form.deadline), true) : "",
          };
          setShareSubject(replacePlaceholders(share.subject, placeholders));
          setShareContent(replacePlaceholders(share.content, placeholders));
          setShareOpen(true);
        } else {
          setShareSubject(null);
          setShareContent(null);
          setShareOpen(false);
        }
      } catch (e) {
        console.error('Share preview failed', e);
        // non-fatal
        setShareSubject(null);
        setShareContent(null);
        setShareOpen(false);
      }

      // Reset form after successful creation
      setForm({ title: "", options: ["", ""], correctAnswer: "", deadline: "" });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectChange = (value: string) => {
    setForm((f) => ({ ...f, correctAnswer: value }));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Create Quiz</h1>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Enter quiz title"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Options</label>
          <div className="space-y-3">
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  aria-invalid={!!errors.options}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeOption(idx)}
                  disabled={form.options.length <= 2}
                  aria-label="Remove option"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={form.options.length >= 6}>
              Add option
            </Button>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Select correct answer</label>
            <select
              className="border rounded-md h-9 px-3 py-1 bg-transparent w-full"
              value={form.correctAnswer}
              onChange={(e) => handleCorrectChange(e.target.value)}
              aria-invalid={!!errors.correctAnswer}
            >
              <option value="" disabled>
                -- Choose option --
              </option>
              {form.options.map((opt, idx) => (
                <option key={idx} value={opt} disabled={!opt.trim()}>
                  {opt || `Option ${idx + 1}`}
                </option>
              ))}
            </select>
            {errors.correctAnswer && (
              <p className="text-sm text-red-600 mt-1">{errors.correctAnswer}</p>
            )}
          </div>
          {errors.options && (
            <p className="text-sm text-red-600 mt-1">{errors.options}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <DateTimePicker
            value={form.deadline}
            onChange={(v) => setForm((f) => ({ ...f, deadline: v }))}
            ariaInvalid={!!errors.deadline}
            placeholder="Pick date & time"
          />
          {errors.deadline && (
            <p className="text-sm text-red-600 mt-1">{errors.deadline}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Deadline must be in the future.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Quiz"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setForm({ title: "", options: ["", ""], correctAnswer: "", deadline: "" })}
            disabled={submitting}
          >
            Reset
          </Button>
        </div>
      </form>

      {shareOpen && shareContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">Share Draft (Populated)</h2>
              <Button variant="ghost" onClick={() => setShareOpen(false)}>Close</Button>
            </div>
            <div className="p-4">
              {shareSubject && (
                <div className="mb-3">
                  <div className="text-sm text-muted-foreground">Subject</div>
                  <div className="font-medium break-words">{shareSubject}</div>
                </div>
              )}
              <div className="text-sm text-muted-foreground mb-1">Content</div>
              <pre className="whitespace-pre-wrap text-sm bg-transparent p-0 max-h-80 overflow-auto">
                {shareContent}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="cursor-pointer"
                  onClick={async () => {
                    const ok = await copyToClipboard(shareContent);
                    if (ok) {
                      setCopiedContent(true);
                      setTimeout(() => setCopiedContent(false), 1500);
                    }
                  }}
                >
                  {copiedContent ? "Copied!" : "Copy content"}
                </Button>
                {shareSubject && (
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={async () => {
                      const ok = await copyToClipboard(shareSubject);
                      if (ok) {
                        setCopiedSubject(true);
                        setTimeout(() => setCopiedSubject(false), 1500);
                      }
                    }}
                  >
                    {copiedSubject ? "Copied!" : "Copy subject"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
