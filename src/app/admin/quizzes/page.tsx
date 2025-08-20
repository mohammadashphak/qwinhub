export const dynamic = "force-dynamic";
import AdminQuizzesInfinite from "@/components/admin/AdminQuizzesInfinite";
import Link from "next/link";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const filter = ((await searchParams)?.filter || "active").toLowerCase() as "active" | "expired";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-3">
          <Link href="/admin" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{filter === "active" ? "Active Quizzes" : "Expired Quizzes"}</h1>
          <Link href="/admin/create-quiz" className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Create Quiz
          </Link>
        </div>

        <AdminFilterTabs current={filter} />

        <AdminQuizzesInfinite filter={filter} pageSize={15} />
      </div>
    </div>
  );
}
