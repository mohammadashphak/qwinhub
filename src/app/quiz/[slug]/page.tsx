export const dynamic = "force-dynamic";
import Link from "next/link";
import PublicQuizDetail from "@/components/public/PublicQuizDetail";

export default async function QuizDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link href="/quizzes" className="text-sm text-blue-600 hover:underline">← Back to Quizzes</Link>
        </div>
        <PublicQuizDetail slug={slug} />
      </div>
    </div>
  );
}
