import { NextRequest, NextResponse } from 'next/server';
import { db, checkPhoneExists } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage } from '@/lib/utils';
import { slugParamSchema, quizResponseSchema, validateParams, validateRequestBody } from '@/lib/validations';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// POST /api/quiz/[slug]/response
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = validateParams(slugParamSchema, await context.params);
    const body = await request.json();
    const data = validateRequestBody(quizResponseSchema, body);

    // Basic sanitation and character whitelist before parsing
    const rawPhone = String(data.phone).trim();
    if (/[A-Za-z]/.test(rawPhone)) {
      return NextResponse.json(createApiError('Phone number must not contain letters', 400), { status: 400 });
    }
    // Allow digits, spaces, parentheses, hyphens, and plus
    if (!/^[0-9\s\-()+]+$/.test(rawPhone)) {
      return NextResponse.json(createApiError('Phone number contains invalid characters', 400), { status: 400 });
    }

    // Parse and normalize phone to E.164 using provided country
    const parsed = parsePhoneNumberFromString(rawPhone, data.country as CountryCode);
    if (!parsed || !parsed.isValid()) {
      return NextResponse.json(createApiError('Invalid phone number for selected country', 400), { status: 400 });
    }
    const e164 = parsed.number; // E.164 formatted phone

    const quiz = await db.quiz.findUnique({ where: { slug }, select: { id: true, correctAnswer: true, deadline: true } });
    if (!quiz) {
      return NextResponse.json(createApiError('Quiz not found', 404), { status: 404 });
    }

    // Check deadline
    const now = new Date();
    if (quiz.deadline <= now) {
      return NextResponse.json(createApiError('Quiz has expired', 400), { status: 400 });
    }

    // Prevent duplicate submissions by phone per quiz
    const exists = await checkPhoneExists(quiz.id, e164);
    if (exists) {
      return NextResponse.json(createApiError('You have already submitted a response for this quiz', 409), { status: 409 });
    }

    const isCorrect = data.answer.trim() === quiz.correctAnswer;

    const saved = await db.response.create({
      data: {
        quizId: quiz.id,
        name: data.name.trim(),
        phone: e164,
        answer: data.answer.trim(),
        isCorrect,
        submittedAt: new Date(),
      },
      select: { id: true, isCorrect: true },
    });

    return NextResponse.json(createApiResponse({ id: saved.id, isCorrect: saved.isCorrect }, 'Response submitted'));
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to submit response';
    const status = message.includes('Validation error') ? 400 : 500;
    return NextResponse.json(createApiError(message, status), { status });
  }
}
