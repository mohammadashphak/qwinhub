"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizCard from "@/components/admin/QuizCard";

export type AdminQuiz = {
  id: string;
  title: string;
  slug: string;
  options: string[];
  correctAnswer: string;
  deadline: string | Date;
  createdAt?: string | Date;
  _count?: { responses: number };
};

type Filter = "active" | "expired";

export default function AdminQuizzesInfinite({ filter, pageSize = 15 }: { filter: Filter; pageSize?: number }) {
  const [items, setItems] = useState<AdminQuiz[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when filter changes
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, [filter]);

  const fetchPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("filter", filter);
      qs.set("pageSize", String(pageSize));
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(`/api/admin/quizzes?${qs.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load quizzes");

      const newItems: AdminQuiz[] = json?.data?.items ?? [];
      const nextHasMore: boolean = !!json?.data?.hasMore;
      const totalCount: number | undefined = json?.data?.total;
      if (typeof totalCount === "number") setTotal(totalCount);
      setItems((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const filtered = newItems.filter((n) => !existing.has(n.id));
        return [...prev, ...filtered];
      });
      setHasMore(nextHasMore);
      const nextCursor: string | null = json?.data?.nextCursor ?? null;
      setCursor(nextCursor);
    } catch (e: any) {
      setError(e?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [filter, cursor, pageSize, loading, hasMore]);

  // Initial and subsequent loads
  useEffect(() => {
    if (items.length === 0) {
      void fetchPage();
    }
  }, [filter]);

  // Intersection observer for auto-loading
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !loading && hasMore) {
        void fetchPage();
      }
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, hasMore, loading]);

  // Manual load-all to ensure completeness if user wants everything without scrolling
  const loadAll = useCallback(async () => {
    let guard = 0;
    while (hasMore && guard < 200) {
      // Avoid overlapping calls
      // eslint-disable-next-line no-await-in-loop
      await fetchPage();
      guard += 1;
    }
  }, [fetchPage, hasMore]);

  return (
    <>
      {items.length === 0 && !loading && !error && (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-600">No quizzes found.</div>
      )}
      {error && (
        <div className="rounded-lg border bg-white p-4 text-sm text-red-600">{error}</div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((q) => (
            <QuizCard key={q.id} quiz={q} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} />

      <div className="flex flex-col items-center gap-2 mt-6">
        {typeof total === "number" && (
          <div className="text-xs text-gray-500">Loaded {items.length} of {total}</div>
        )}
        {loading ? (
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm rounded-md border bg-white text-gray-500 cursor-not-allowed"
            disabled
          >
            Loading...
          </button>
        ) : hasMore ? (
          <button
            type="button"
            onClick={() => fetchPage()}
            className="inline-flex items-center px-4 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
          >
            Load more
          </button>
        ) : (
          <span className="text-sm text-gray-500">No more quizzes</span>
        )}

        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50"
          >
            Load all
          </button>
        )}
      </div>
    </>
  );
}
