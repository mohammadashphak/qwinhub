import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage } from '@/lib/utils';
import { slugParamSchema, validateParams } from '@/lib/validations';

// GET /api/quiz/[slug]
// Public: returns quiz details. Only exposes correctAnswer if quiz is expired.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = validateParams(slugParamSchema, await context.params);

    const quiz = await db.quiz.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        options: true,
        correctAnswer: true,
        deadline: true,
      },
    });

    if (!quiz) {
      return NextResponse.json(createApiError('Quiz not found', 404), { status: 404 });
    }

    const expired = quiz.deadline <= new Date();
    const result = {
      ...quiz,
      correctAnswer: expired ? quiz.correctAnswer : null,
    };

    return NextResponse.json(createApiResponse({ quiz: result }));
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to fetch quiz';
    return NextResponse.json(createApiError(message, 500), { status: 500 });
  }
}
