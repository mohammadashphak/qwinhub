import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage, createSlug } from '@/lib/utils';
import { slugParamSchema, quizUpdateSchema, validateParams, validateRequestBody } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin(request);
    const { slug } = validateParams(slugParamSchema, params);

    const quiz = await db.quiz.findUnique({ where: { slug } });
    if (!quiz) {
      return NextResponse.json(createApiError('Quiz not found', 404), { status: 404 });
    }
    return NextResponse.json(createApiResponse({ quiz }));
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(createApiError(message || 'Failed to fetch quiz', status), { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin(request);
    const { slug } = validateParams(slugParamSchema, params);

    const body = await request.json();
    const data = validateRequestBody(quizUpdateSchema, body);

    // If title provided, regenerate slug and ensure uniqueness
    let nextSlug: string | undefined;
    if (data.title) {
      const generated = createSlug(data.title.trim());
      if (generated && generated !== slug) {
        const conflict = await db.quiz.findUnique({ where: { slug: generated }, select: { id: true } });
        if (conflict) {
          return NextResponse.json(
            createApiError('A quiz with this title already exists. Please choose a different title.', 409, 'SLUG_CONFLICT'),
            { status: 409 }
          );
        }
        nextSlug = generated;
      }
    }

    const updated = await db.quiz.update({
      where: { slug },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(nextSlug && { slug: nextSlug }),
        ...(data.options && { options: data.options.map((o) => o.trim()) }),
        ...(data.correctAnswer && { correctAnswer: data.correctAnswer.trim() }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
      },
      select: { id: true, slug: true, title: true, options: true, correctAnswer: true, deadline: true },
    });

    return NextResponse.json(createApiResponse({ quiz: updated }, 'Quiz updated successfully'));
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(createApiError(message || 'Failed to update quiz', status), { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireAdmin(request);
    const { slug } = validateParams(slugParamSchema, params);

    const quiz = await db.quiz.findUnique({ where: { slug }, select: { id: true } });
    if (!quiz) {
      return NextResponse.json(createApiError('Quiz not found', 404), { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.response.deleteMany({ where: { quizId: quiz.id } });
      // Clean up potential winner records referencing this quiz
      try {
        await tx.winner.deleteMany({ where: { quizId: quiz.id } });
      } catch (_) {}
      try {
        await tx.monthlyWinner.deleteMany({ where: { quizId: quiz.id } });
      } catch (_) {}
      await tx.quiz.delete({ where: { id: quiz.id } });
    });

    return NextResponse.json(createApiResponse({ success: true }, 'Quiz deleted successfully'));
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(createApiError(message || 'Failed to delete quiz', status), { status });
  }
}
