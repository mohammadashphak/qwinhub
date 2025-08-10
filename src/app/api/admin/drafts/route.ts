import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { draftSchema, validateEmailTemplate } from '@/lib/validations';
import { createApiResponse, createApiError, getErrorMessage } from '@/lib/utils';

const DRAFT_TYPES = ['SHARE', 'RESULT', 'MONTHLY'] as const;
type DraftTypeUnion = typeof DRAFT_TYPES[number];
const isDraftType = (t: string): t is DraftTypeUnion =>
  (DRAFT_TYPES as readonly string[]).includes(t);

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Fetch all drafts
    const drafts = await db.draft.findMany({
      orderBy: [
        { type: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json(
      createApiResponse({ drafts })
    );

  } catch (error) {
    console.error('Fetch drafts error:', error);
    return NextResponse.json(
      createApiError(getErrorMessage(error), 500),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const body = await request.json();
    
    // Validate input
    const validatedData = draftSchema.parse(body);
    const { type, subject, content } = validatedData;

    // Server-side placeholder validation (lenient):
    // - Block on invalid placeholders
    // - Allow missing placeholders but return as warnings
    const { invalidPlaceholders, missingPlaceholders } = validateEmailTemplate(
      type as 'SHARE' | 'RESULT' | 'MONTHLY',
      content
    );

    if (invalidPlaceholders.length > 0) {
      const details = `Invalid placeholders: ${invalidPlaceholders.join(', ')}`;
      return NextResponse.json(
        createApiError(details, 400),
        { status: 400 }
      );
    }

    // Check if draft of this type already exists
    const existingDraft = await db.draft.findUnique({
      where: { type }
    });

    let draft;
    if (existingDraft) {
      // Update existing draft
      draft = await db.draft.update({
        where: { type },
        data: {
          subject,
          content,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new draft
      draft = await db.draft.create({
        data: {
          type,
          subject,
          content,
        }
      });
    }

    return NextResponse.json(
      createApiResponse({ 
        draft,
        message: `${type} draft ${existingDraft ? 'updated' : 'created'} successfully`,
        warnings: missingPlaceholders.length > 0 ? {
          missingPlaceholders,
        } : undefined,
      })
    );

  } catch (error) {
    console.error('Save draft error:', error);
    return NextResponse.json(
      createApiError(getErrorMessage(error), 400),
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !isDraftType(type)) {
      return NextResponse.json(
        createApiError('Invalid draft type', 400),
        { status: 400 }
      );
    }

    // Delete the draft
    await db.draft.delete({
      where: { type }
    });

    return NextResponse.json(
      createApiResponse({ 
        message: `${type} draft deleted successfully`
      })
    );

  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      createApiError(getErrorMessage(error), 500),
      { status: 500 }
    );
  }
}
