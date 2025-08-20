import { z } from 'zod';

// Country-aware phone inputs (server will parse to E.164 using libphonenumber-js)
export const countrySchema = z
  .string()
  .min(2, 'Country code is required')
  .max(2, 'Country code must be ISO 3166-1 alpha-2 (e.g., IN, US)')
  .transform((v) => v.toUpperCase());

export const phoneInputSchema = z
  .string()
  .min(1, 'Phone number is required');

// Admin authentication
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Draft validation
export const draftSchema = z.object({
  type: z.enum(['SHARE', 'RESULT', 'MONTHLY']),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
});

// Quiz creation validation
export const quizCreateSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(200, 'Title too long'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed')
    .refine((options) => new Set(options).size === options.length, {
      message: 'All options must be unique',
    }),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  deadline: z
    .string()
    .min(1, 'Deadline is required')
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: 'Deadline must be in the future',
    }),
})
  .refine((data) => data.options.includes(data.correctAnswer), {
    message: 'Correct answer must match one of the options exactly',
    path: ['correctAnswer'],
  });

// Quiz update validation (allows partial updates)
export const quizUpdateSchema = quizCreateSchema.partial();

// Quiz response validation
export const quizResponseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  country: countrySchema,
  phone: phoneInputSchema,
  answer: z.string().min(1, 'Please select an answer'),
});

// API route validation helpers
export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

// Cron job validation
export const cronAuthSchema = z.object({
  authorization: z
    .string()
    .refine((val) => val === `Bearer ${process.env.CRON_SECRET}`, {
      message: 'Invalid cron authorization',
    }),
});

// Email template placeholders validation
export const emailPlaceholders = {
  SHARE: z.object({
    TITLE: z.string(),
    OPTIONS: z.string(), // Added: Quiz options for sharing
    LINK: z.string().url(),
    DEADLINE: z.string(),
  }),
  RESULT: z.object({
    TITLE: z.string(),
    OPTIONS: z.string(), // Added: Quiz options
    TOTAL_RESPONSES: z.string(),
    CORRECT_COUNT: z.string(),
    WRONG_COUNT: z.string(),
    CORRECT_NAMES: z.string(),
    WRONG_NAMES: z.string(),
    CORRECT_PHONES: z.string(), // Added: Phone numbers of correct answers
    WRONG_PHONES: z.string(), // Added: Phone numbers of wrong answers
    WINNER_NAME: z.string(),
    WINNER_PHONE: z.string(),
  }),
  MONTHLY: z.object({
    TITLE: z.string(), // Added: Title of winning quiz
    OPTIONS: z.string(), // Added: Options of winning quiz
    MONTH: z.string(),
    YEAR: z.string(),
    TOTAL_WINNERS: z.string(), // Total number of winners in the month
    WINNER_NAMES: z.string(), // Added: All winner names (comma-separated)
    WINNER_PHONES: z.string(), // Added: All winner phones (comma-separated)
    MONTHLY_WINNER_NAME: z.string(), // Added: Final monthly winner name
    MONTHLY_WINNER_PHONE: z.string(), // Added: Final monthly winner phone
  }),
} as const;

// Email placeholder values type
export type EmailPlaceholderValues = {
  SHARE: z.infer<typeof emailPlaceholders.SHARE>;
  RESULT: z.infer<typeof emailPlaceholders.RESULT>;
  MONTHLY: z.infer<typeof emailPlaceholders.MONTHLY>;
};

// Utility function to validate email template placeholders
export function validateEmailTemplate(
  type: keyof typeof emailPlaceholders,
  content: string
): { isValid: boolean; missingPlaceholders: string[]; invalidPlaceholders: string[] } {
  const schema = emailPlaceholders[type];
  const validPlaceholders = Object.keys(schema.shape);
  
  // Extract placeholders from content
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const foundPlaceholders = new Set<string>();
  let match;
  
  while ((match = placeholderRegex.exec(content)) !== null) {
    foundPlaceholders.add(match[1]);
  }
  
  // Check for missing required placeholders
  const missingPlaceholders = validPlaceholders.filter(
    placeholder => !foundPlaceholders.has(placeholder)
  );
  
  // Check for invalid placeholders
  const invalidPlaceholders = Array.from(foundPlaceholders).filter(
    placeholder => !validPlaceholders.includes(placeholder)
  );
  
  return {
    // Lenient mode: only block on invalid placeholders; allow missing ones
    isValid: invalidPlaceholders.length === 0,
    missingPlaceholders,
    invalidPlaceholders
  };
}

// Utility function to replace placeholders in email content
export function replacePlaceholders(
  content: string,
  placeholderValues: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
    return placeholderValues[placeholder] || match;
  });
}

// Utility function to validate API request bodies
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Utility function to validate URL parameters
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid parameters: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}