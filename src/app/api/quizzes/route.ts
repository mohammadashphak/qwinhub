import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createApiError, createApiResponse, getErrorMessage } from '@/lib/utils';

// GET /api/quizzes?filter=active|expired&pageSize=15&cursor=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let filter = (searchParams.get('filter') || 'active').toLowerCase();
    if (filter !== 'active' && filter !== 'expired') filter = 'active';
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '15', 10), 1), 100);
    const cursorParam = searchParams.get('cursor');

    let cursor: { createdAt: string; id: string } | null = null;
    if (cursorParam) {
      try {
        const decoded = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf-8'));
        if (decoded?.createdAt && decoded?.id) {
          cursor = { createdAt: decoded.createdAt, id: decoded.id };
        }
      } catch (e) {
        console.log('Invalid cursor format:', e);
      }
    }

    const now = new Date();
    const where = filter === 'active' ? { deadline: { gt: now } } : { deadline: { lte: now } };
    const orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];

    // Cursor pagination condition (createdAt desc, id desc)
    let paginationWhere: any = {};
    if (cursor) {
      const cDate = new Date(cursor.createdAt);
      paginationWhere = {
        OR: [
          { createdAt: { lt: cDate } },
          { createdAt: cDate, id: { lt: cursor.id } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      db.quiz.findMany({
        where: { AND: [where, paginationWhere] },
        orderBy,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          options: true,
          correctAnswer: true,
          deadline: true,
          createdAt: true,
        },
      }),
      db.quiz.count({ where }),
    ]);

    // Only expose correctAnswer for expired quizzes
    const withPrivacy = items.map((q) => ({
      ...q,
      correctAnswer: filter === 'expired' ? q.correctAnswer : null,
    }));

    const last = items[items.length - 1];
    const nextCursor = items.length === pageSize && last
      ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString('base64')
      : null;
    const hasMore = !!nextCursor;

    return NextResponse.json(
      createApiResponse({ items: withPrivacy, pageSize, total, hasMore, nextCursor })
    );
  } catch (error) {
    const message = getErrorMessage(error) || 'Failed to fetch quizzes';
    const status = 500;
    return NextResponse.json(createApiError(message, status), { status });
  }
}
