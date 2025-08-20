import { getQuizBySlug, getQuizStats } from "@/lib/db";
import Link from "next/link";
import AdminQuizResponsesClient from "@/components/admin/AdminQuizResponsesClient";

export default async function QuizResponsesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const quiz = await getQuizBySlug(slug);
  if (!quiz) {
    return (
      <div className="p-8">
        <div className="rounded-md border bg-white p-6">Quiz not found.</div>
      </div>
    );
  }

  const stats = await getQuizStats(quiz.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-3">
          <Link href="/admin/quizzes" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Responses · {quiz.title}</h1>
            <div className="text-sm text-gray-600">Slug: {quiz.slug}</div>
          </div>
          <Link href={`/admin/quiz/${quiz.slug}/edit`} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50">
            Edit Quiz
          </Link>
        </div>

        <AdminQuizResponsesClient
          quiz={{ title: quiz.title, slug: quiz.slug, winner: quiz.winner ? { name: quiz.winner.name, phone: quiz.winner.phone } : null }}
          stats={stats}
          responses={(quiz.responses || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            answer: r.answer,
            isCorrect: r.isCorrect,
            submittedAt: new Date(r.submittedAt).toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
