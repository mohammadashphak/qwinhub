import { type Prisma } from '@prisma/client';

// Database model types with relations
export type AdminWithRelations = Prisma.AdminGetPayload<{
  select: {
    id: true;
    email: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type DraftWithRelations = Prisma.DraftGetPayload<{}>;

export type QuizWithRelations = Prisma.QuizGetPayload<{
  include: {
    responses: true;
    winner: true;
    monthlyWinner: true;
    _count: {
      select: {
        responses: true;
      };
    };
  };
}>;

export type QuizWithStats = Prisma.QuizGetPayload<{
  include: {
    _count: {
      select: {
        responses: true;
      };
    };
  };
}>;

export type ResponseWithQuiz = Prisma.ResponseGetPayload<{
  include: {
    quiz: {
      select: {
        title: true;
        slug: true;
        deadline: true;
      };
    };
  };
}>;

export type WinnerWithQuiz = Prisma.WinnerGetPayload<{
  include: {
    quiz: {
      select: {
        id: true;
        title: true;
        slug: true;
        deadline: true;
      };
    };
  };
}>;

export type MonthlyWinnerWithQuiz = Prisma.MonthlyWinnerGetPayload<{
  include: {
    quiz: {
      select: {
        id: true;
        title: true;
        slug: true;
        deadline: true;
      };
    };
  };
}>;

// Form types (based on Zod schemas)
export interface AdminLoginForm {
  email: string;
  password: string;
}

export interface DraftForm {
  type: 'SHARE' | 'QUESTION' | 'MONTHLY';
  subject: string;
  content: string;
}

export interface QuizCreateForm {
  title: string;
  options: string[];
  correctAnswer: string;
  deadline: string; // ISO string from form
}

export interface QuizResponseForm {
  name: string;
  phone: string;
  answer: string;
}

export interface UserInfo {
  name: string;
  phone: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  status: number;
}

export interface ApiError {
  success: false;
  message: string;
  status: number;
  code?: string;
}

// Quiz statistics
export interface QuizStats {
  total: number;
  correct: number;
  wrong: number;
  correctPercentage: number;
  wrongPercentage: number;
}

export interface QuizParticipant {
  name: string;
  phone: string;
  answer: string;
  isCorrect: boolean;
  submittedAt: Date;
}

export interface QuizResults {
  quiz: {
    id: string;
    title: string;
    slug: string;
    options: string[];
    correctAnswer: string;
    deadline: Date;
    isProcessed: boolean;
  };
  stats: QuizStats;
  participants: {
    correct: QuizParticipant[];
    wrong: QuizParticipant[];
  };
  winner: {
    name: string;
    phone: string;
    selectedAt: Date;
  } | null;
}

// Dashboard types
export interface DashboardStats {
  totalQuizzes: number;
  activeQuizzes: number;
  expiredQuizzes: number;
  totalResponses: number;
  totalWinners: number;
  thisMonthQuizzes: number;
  thisMonthResponses: number;
}

export interface RecentActivity {
  type: 'quiz_created' | 'response_received' | 'winner_selected' | 'monthly_winner';
  title: string;
  description: string;
  timestamp: Date;
  href?: string;
}

// Email template types
export interface EmailTemplate {
  type: 'SHARE' | 'QUESTION' | 'MONTHLY';
  subject: string;
  content: string;
  placeholders: string[];
}

export interface EmailPlaceholderValues {
  TITLE?: string;
  LINK?: string;
  DEADLINE?: string;
  TOTAL_RESPONSES?: string;
  CORRECT_COUNT?: string;
  WRONG_COUNT?: string;
  CORRECT_NAMES?: string;
  WRONG_NAMES?: string;
  WINNER_NAME?: string;
  WINNER_PHONE?: string;
  MONTH?: string;
  YEAR?: string;
  TOTAL_WINNERS?: string;
}

// Countdown timer types
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

// Component prop types
export interface QuizCardProps {
  quiz: QuizWithStats;
  isAdmin?: boolean;
}

export interface UserInfoFormProps {
  initialValues?: UserInfo;
  onSubmit: (values: UserInfo) => void;
  disabled?: boolean;
}

export interface CountdownTimerProps {
  deadline: Date;
  onExpire?: () => void;
  className?: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface Breadcrumb {
  title: string;
  href?: string;
}

// Table types
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

// Filter types
export interface QuizFilters {
  status?: 'all' | 'active' | 'expired' | 'processed';
  search?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  className?: string;
}

// Form state types
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isLoading: boolean;
  isValid: boolean;
}

// Modal types
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

// Toast types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Environment types
export interface EnvVars {
  DATABASE_URL: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  RESEND_API_KEY: string;
  CRON_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonEmptyArray<T> = [T, ...T[]];

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface DatabaseError {
  code: string;
  message: string;
  constraint?: string;
}

// Export all Prisma enums for convenience
export { DraftType } from '@prisma/client';