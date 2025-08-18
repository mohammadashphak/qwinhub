import { getQuizBySlug } from "@/lib/db";
import AdminQuizEditor from "@/components/admin/AdminQuizEditor";
import Link from "next/link";

export default async function EditQuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);

  if (!quiz) {
    return (
      <div className="p-8">
        <div className="rounded-md border bg-white p-6">Quiz not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-3">
          <Link href="/admin/quizzes" className="inline-flex items-center text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Quiz</h1>
          <Link href={`/admin/quiz/${quiz.slug}/responses`} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border bg-white hover:bg-gray-50">View Responses</Link>
        </div>

        <AdminQuizEditor quiz={{
          slug: quiz.slug,
          title: quiz.title,
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
          deadline: quiz.deadline,
        }} />
      </div>
    </div>
  );
}
