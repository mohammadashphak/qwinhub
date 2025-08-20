"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "qwinhub-admin-quizzes-filter";

type Props = {
  current: "active" | "expired";
};

export default function AdminFilterTabs({ current }: Props) {
  const [selected, setSelected] = useState<"active" | "expired">(current);

  // Initialize from localStorage if URL doesn't specify a different filter
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as
        | "active"
        | "expired"
        | null;
      if (saved && saved !== current) {
        setSelected(saved);
      }
    } catch (_) {}
  }, [current]);

  // Persist selection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, selected);
    } catch (_) {}
  }, [selected]);

  return (
    <div className="mb-6 flex items-center gap-2">
      <FilterLink
        label="Active"
        href="/admin/quizzes?filter=active"
        active={selected === "active"}
        onClick={() => setSelected("active")}
      />
      <FilterLink
        label="Expired"
        href="/admin/quizzes?filter=expired"
        active={selected === "expired"}
        onClick={() => setSelected("expired")}
      />
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md border ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
