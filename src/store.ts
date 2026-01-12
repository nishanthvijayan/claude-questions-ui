/**
 * In-memory session store for question sessions
 */

export interface Question {
  id: string;
  question: string;
  description?: string;
  type?: "text" | "select" | "multiselect" | "boolean";
  options?: string[];
  allowCustom?: boolean;
  required?: boolean;
  default?: string;
}

export interface Session {
  id: string;
  title?: string;
  context?: string;
  questions: Question[];
  answers: Record<string, unknown> | null; // null until submitted
  createdAt: number;
}

// In-memory store
const sessions = new Map<string, Session>();

/**
 * Create a new session with questions
 */
export function createSession(
  id: string,
  questions: Question[],
  title?: string,
  context?: string
): Session {
  const session: Session = {
    id,
    title,
    context,
    questions,
    answers: null,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

/**
 * Get a session by ID
 */
export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

/**
 * Submit answers for a session
 */
export function submitAnswers(
  id: string,
  answers: Record<string, unknown>
): boolean {
  const session = sessions.get(id);
  if (!session) {
    return false;
  }
  if (session.answers !== null) {
    // Already submitted
    return false;
  }
  session.answers = answers;
  return true;
}

/**
 * Delete a session (cleanup)
 */
export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

/**
 * Check if a session has been answered
 */
export function isSessionAnswered(id: string): boolean {
  const session = sessions.get(id);
  return session?.answers !== null;
}
