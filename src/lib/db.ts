import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during development with hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Database utility functions
export async function checkDraftsExist(): Promise<boolean> {
  const drafts = await db.draft.count();
  return drafts === 3; // All three draft types must exist
}

export async function getDraftByType(type: 'SHARE' | 'RESULT' | 'MONTHLY') {
  return await db.draft.findUnique({
    where: { type },
  });
}

// Quiz utilities
export async function getQuizBySlug(slug: string) {
  return await db.quiz.findUnique({
    where: { slug },
    include: {
      responses: true,
      winner: true,
    },
  });
}

export async function getExpiredUnprocessedQuizzes() {
  return await db.quiz.findMany({
    where: {
      deadline: {
        lte: new Date(),
      },
      isProcessed: false,
    },
    include: {
      responses: true,
    },
  });
}

// Response utilities
export async function checkPhoneExists(quizId: string, phone: string): Promise<boolean> {
  const existing = await db.response.findUnique({
    where: {
      unique_response_per_phone_per_quiz: {
        quizId,
        phone,
      },
    },
  });
  return !!existing;
}

// Winner utilities
export async function getMonthlyWinners(month: number, year: number) {
  return await db.winner.findMany({
    where: {
      selectedAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function hasMonthlyWinner(month: number, year: number): Promise<boolean> {
  const winner = await db.monthlyWinner.findUnique({
    where: {
      unique_monthly_winner: {
        month,
        year,
      },
    },
  });
  return !!winner;
}

export async function createMonthlyWinner(
  quizId: string,
  month: number,
  year: number,
  name: string,
  phone: string
) {
  return await db.monthlyWinner.create({
    data: {
      quizId,
      month,
      year,
      name,
      phone,
    },
    include: {
      quiz: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });
}

// Admin utilities
export async function getAdminByEmail(email: string) {
  return await db.admin.findUnique({
    where: { email },
  });
}

// Statistics utilities
export async function getQuizStats(quizId: string) {
  const [total, correct, wrong] = await Promise.all([
    db.response.count({ where: { quizId } }),
    db.response.count({ where: { quizId, isCorrect: true } }),
    db.response.count({ where: { quizId, isCorrect: false } }),
  ]);

  return { total, correct, wrong };
}

export async function getAllQuizzes(adminView: boolean = false) {
  return await db.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          responses: true,
        },
      },
      ...(adminView && {
        responses: {
          select: {
            name: true,
            phone: true,
            answer: true,
            isCorrect: true,
            submittedAt: true,
          },
        },
        winner: true,
      }),
    },
  });
}