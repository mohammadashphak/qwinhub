export const dynamic = "force-dynamic"; // This export forces Next.js to render this page as a dynamic route (SSR) instead of static generation.
import Link from "next/link";
import PublicQuizzesInfinite from "@/components/public/PublicQuizzesInfinite";

export default async function QuizzesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = (params?.filter || "active").toLowerCase() as "active" | "expired";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600 mt-2">Answer active quizzes or review answers from expired ones.</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          <FilterLink label="Active" href="/quizzes?filter=active" active={filter === "active"} />
          <FilterLink label="Expired" href="/quizzes?filter=expired" active={filter === "expired"} />
        </div>

        <PublicQuizzesInfinite filter={filter} pageSize={15} />
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md border ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
