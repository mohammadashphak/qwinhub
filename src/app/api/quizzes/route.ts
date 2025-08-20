import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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
          winner: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      }),
      db.quiz.count({ where }),
    ]);

    // Only expose correctAnswer for expired quizzes; add masked winner for expired quizzes
    const withPrivacy = items.map((q) => {
      const base: any = {
        id: q.id,
        title: q.title,
        slug: q.slug,
        options: q.options,
        correctAnswer: filter === 'expired' ? q.correctAnswer : null,
        deadline: q.deadline,
        createdAt: q.createdAt,
      };
      if (filter === 'expired' && q.winner) {
        // Mask phone for public: show +country code and first/last 2-3 digits
        let masked = '****';
        try {
          const parsed = parsePhoneNumberFromString(q.winner.phone || '');
          if (parsed) {
            const cc = parsed.countryCallingCode ? `+${parsed.countryCallingCode}` : '';
            const national = parsed.nationalNumber || '';
            const keep = national.length >= 7 ? 3 : 2;
            const start = national.slice(0, keep);
            const end = national.slice(-keep);
            masked = `${cc} ${start}****${end}`;
          }
        } catch (err) {
          console.error('Error parsing phone number:', err);
        }
        base.winner = { name: q.winner.name, phoneMasked: masked };
      }
      return base;
    });

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
