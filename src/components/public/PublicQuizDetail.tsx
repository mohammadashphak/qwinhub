"use client";

import React, { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/utils";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

type Quiz = {
  id: string;
  slug: string;
  title: string;
  options: string[];
  correctAnswer: string | null; // null if active
  deadline: string | Date;
};

export default function PublicQuizDetail({ slug }: { slug: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryCode>("IN"); // default
  const [answer, setAnswer] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const submittedKey = useMemo(() => `qwinhub-quiz-submitted:${slug}`, [slug]);

  // Load quiz
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/quiz/${slug}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load quiz");
        if (!cancelled) setQuiz(json?.data?.quiz ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load quiz");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Load persisted user info
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.name) setName(String(obj.name));
        if (obj?.phone) setPhone(String(obj.phone));
        if (obj?.country) setCountry(String(obj.country).toUpperCase());
      }
      const sub = localStorage.getItem(submittedKey);
      if (sub === "1") setSubmitted(true);
    } catch (_) {}
  }, [submittedKey]);

  // Persist user info on change
  useEffect(() => {
    try {
      const data = {
        name: name.trim(),
        phone: phone,
        country: country.toUpperCase(),
      };
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(data));
    } catch (_) {}
  }, [name, phone, country]);

  const expired = useMemo(() => {
    if (!quiz) return false;
    const d = new Date(quiz.deadline as any);
    return Date.now() > d.getTime();
  }, [quiz]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    if (expired) return;
    if (submitted) return;
    if (!answer) {
      setSubmittedMsg("Please select an answer.");
      return;
    }
    // Client validations: reject letters / invalid characters before library parsing
    const rawPhone = String(phone).trim();
    if (/[A-Za-z]/.test(rawPhone)) {
      setSubmittedMsg("Phone number must not contain letters.");
      return;
    }
    if (!/^[0-9\s\-()+]+$/.test(rawPhone)) {
      setSubmittedMsg("Phone number contains invalid characters.");
      return;
    }
    // Country-aware validation using libphonenumber-js
    const parsed = parsePhoneNumberFromString(rawPhone, country);
    if (!name.trim()) {
      setSubmittedMsg("Enter a valid name.");
      return;
    }
    if (!parsed || !parsed.isValid()) {
      setSubmittedMsg("Enter a valid phone number for the selected country.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmittedMsg(null);
      const res = await fetch(`/api/quiz/${quiz.slug}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          country: country.toUpperCase(),
          phone: rawPhone,
          answer,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to submit");

      setSubmitted(true);
      localStorage.setItem(submittedKey, "1");
      setSubmittedMsg(
        json?.message ||
          (json?.data?.isCorrect ? "Submitted. Correct!" : "Submitted.")
      );
    } catch (e: any) {
      const msg = e?.message || "Failed to submit";
      setSubmittedMsg(msg);
      // If already submitted per server, mark local as submitted to block repeat attempts
      if (msg.toLowerCase().includes("already submitted")) {
        setSubmitted(true);
        localStorage.setItem(submittedKey, "1");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6 text-red-600">
        {error}
      </div>
    );
  }
  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6">
        Quiz not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-1">{quiz.title}</h1>
      <p className="text-sm text-gray-600 mb-4">
        Select one option and submit your response.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Options */}
        <div className="space-y-2">
          {quiz.options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors select-none ${
                answer === opt
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={opt}
                checked={answer === opt}
                onChange={() => setAnswer(opt)}
                disabled={expired || submitted}
                className="sr-only"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        {/* User info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={expired || submitted}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase() as CountryCode)}
              disabled={expired || submitted}
              required
            >
              <option value="IN">India (+91)</option>
              <option value="US">United States (+1)</option>
              <option value="GB">United Kingdom (+44)</option>
              <option value="AE">United Arab Emirates (+971)</option>
              <option value="SG">Singapore (+65)</option>
              <option value="AU">Australia (+61)</option>
              <option value="CA">Canada (+1)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              inputMode="tel"
              pattern="^[0-9\s\-()+]+$"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={expired || submitted}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              We validate this by country and normalize to E.164 format.
            </p>
          </div>
        </div>

        {/* Submit / state */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={expired || submitted || submitting}
            className={`inline-flex items-center px-4 py-2 text-sm rounded-md text-white ${
              expired || submitted
                ? "bg-gray-400 cursor-not-allowed"
                : submitting
                ? "bg-blue-400 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {expired
              ? "Quiz expired"
              : submitted
              ? "Submitted"
              : submitting
              ? "Submitting..."
              : "Submit Answer"}
          </button>
          {submittedMsg && (
            <span className="text-sm text-gray-600">{submittedMsg}</span>
          )}
        </div>
      </form>

      {/* Reveal answer for expired */}
      {expired && quiz.correctAnswer && (
        <div className="mt-6 p-3 rounded border border-blue-200 bg-blue-50 text-blue-800 text-sm">
          Correct Answer: <strong>{quiz.correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
