export const dynamic = "force-dynamic"; // This export forces Next.js to render this page as a dynamic route (SSR) instead of static generation.
import PublicQuizzesInfinite from "@/components/public/PublicQuizzesInfinite";
import PublicFilterTabs from "@/components/public/PublicFilterTabs";

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

        <PublicFilterTabs current={filter} />

        <PublicQuizzesInfinite filter={filter} pageSize={15} />
      </div>
    </div>
  );
}
