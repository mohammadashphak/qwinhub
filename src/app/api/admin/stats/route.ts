import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage } from '@/lib/utils';

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const now = new Date();

    const [totalQuizzes, activeQuizzes, totalResponses] = await Promise.all([
      db.quiz.count(),
      db.quiz.count({ where: { deadline: { gt: now } } }),
      db.response.count(),
    ]);

    return NextResponse.json(
      createApiResponse({ totalQuizzes, activeQuizzes, totalResponses })
    );
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to fetch admin stats';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(createApiError(message, status), { status });
  }
}
