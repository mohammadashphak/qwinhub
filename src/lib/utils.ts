import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import slugify from 'slugify';
import { format, isAfter, isBefore } from 'date-fns';

// Tailwind CSS class merger utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Slug generation utility
export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

// Date and time utilities
export function formatDeadline(deadline: Date, includeTime: boolean = true): string {
  const formatString = includeTime ? 'PPP p' : 'PPP';
  return format(deadline, formatString);
}

export function isQuizExpired(deadline: Date): boolean {
  return isAfter(new Date(), deadline);
}

export function isQuizActive(deadline: Date): boolean {
  return isBefore(new Date(), deadline);
}

// Random selection utility for winner selection
export function selectRandomItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

// URL utilities
export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://qwinhub.com';
}

export function createQuizUrl(slug: string): string {
  return `${getBaseUrl()}/quiz/${slug}`;
}

export function createAdminQuizUrl(id: string): string {
  return `${getBaseUrl()}/admin/question/${id}`;
}

// Copy to clipboard utility for sharing quiz links
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// API response utilities
export function createApiResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
) {
  return {
    success: true,
    message,
    data,
    status,
  };
}

export function createApiError(
  message: string,
  status: number = 500,
  code?: string
) {
  return {
    success: false,
    message,
    status,
    code,
  };
}

// Constants
export const STORAGE_KEYS = {
  USER_INFO: 'qwinhub-user-info',
  THEME: 'qwinhub-theme',
} as const;
