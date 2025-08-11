import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, checkDraftsExist } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage } from '@/lib/utils';
import { createSlug } from '@/lib/utils';
import { quizCreateSchema, validateRequestBody } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Auth: only admin can create quizzes
    await requireAdmin(request);

    // Validate request body
    const body = await request.json();
    const data = validateRequestBody(quizCreateSchema, body);

    // Enforce drafts requirement
    const hasAllDrafts = await checkDraftsExist();
    if (!hasAllDrafts) {
      return NextResponse.json(
        createApiError('All 3 email templates (SHARE, RESULT, MONTHLY) must be configured before creating a quiz.', 400, 'DRAFTS_MISSING'),
        { status: 400 }
      );
    }

    // Generate slug and ensure uniqueness
    const slug = createSlug(data.title);
    const existing = await db.quiz.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        createApiError('A quiz with this title already exists. Please choose a different title.', 409, 'SLUG_CONFLICT'),
        { status: 409 }
      );
    }

    // Persist quiz (deadline already validated to be future; store as UTC Date)
    const quiz = await db.quiz.create({
      data: {
        title: data.title.trim(),
        slug,
        options: data.options.map((o) => o.trim()),
        correctAnswer: data.correctAnswer.trim(),
        deadline: new Date(data.deadline),
      },
      select: { id: true, slug: true, title: true },
    });

    return NextResponse.json(
      createApiResponse(quiz, 'Quiz created successfully', 201),
      { status: 201 }
    );
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(
      createApiError(message || 'Failed to create quiz', status),
      { status }
    );
  }
}
