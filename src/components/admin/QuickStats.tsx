"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Clock, Users } from "lucide-react";

export default function QuickStats() {
  const [totalQuizzes, setTotalQuizzes] = useState<number | null>(null);
  const [activeQuizzes, setActiveQuizzes] = useState<number | null>(null);
  const [totalResponses, setTotalResponses] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store", credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json?.data || {};
        if (!cancelled) {
          setTotalQuizzes(typeof data.totalQuizzes === "number" ? data.totalQuizzes : null);
          setActiveQuizzes(typeof data.activeQuizzes === "number" ? data.activeQuizzes : null);
          setTotalResponses(typeof data.totalResponses === "number" ? data.totalResponses : null);
        }
      } catch (e) {
        if (!cancelled) {
          setTotalQuizzes(null);
          setActiveQuizzes(null);
          setTotalResponses(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (n: number | null) => (n != null ? n.toLocaleString() : "-");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-gray-200 animate-pulse" />
            ) : (
              fmt(totalQuizzes)
            )}
          </div>
          <p className="text-xs text-muted-foreground">All time quizzes created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Quizzes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-gray-200 animate-pulse" />
            ) : (
              fmt(activeQuizzes)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Currently accepting responses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <span className="inline-block h-6 w-16 rounded bg-gray-200 animate-pulse" />
            ) : (
              fmt(totalResponses)
            )}
          </div>
          <p className="text-xs text-muted-foreground">All time quiz responses</p>
        </CardContent>
      </Card>
    </div>
  );
}
