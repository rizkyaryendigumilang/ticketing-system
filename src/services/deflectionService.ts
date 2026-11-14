import type { Ticket } from '../types/crm.ts';
import { KB_ARTICLES, type KbArticle } from '../config/knowledgeBaseData.ts';

export interface DeflectionSuggestion {
  article: KbArticle;
  relevanceScore: number;
  matchedKeywords: string[];
}

// Stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'yang', 'untuk', 'pada', 'ke', 'di', 'dari', 'ini', 'itu', 'dengan', 'dan', 'atau', 'tidak', 'bisa',
  'saya', 'kami', 'anda', 'mereka', 'dia', 'sudah', 'belum', 'ada', 'akan', 'karena', 'agar', 'jika',
  'the', 'and', 'or', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'an', 'a', 'is', 'it'
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/**
 * Searches the Knowledge Base for potential deflection solutions
 * based on the user's issue subject and description.
 */
export function findSuggestedSolutions(
  appId: string,
  subject: string,
  description = '',
  maxResults = 2,
): DeflectionSuggestion[] {
  if (!subject.trim()) return [];

  const queryKeywords = extractKeywords(`${subject} ${description}`);
  if (queryKeywords.length === 0) return [];

  const suggestions: DeflectionSuggestion[] = [];

  for (const article of KB_ARTICLES) {
    const articleKeywords = extractKeywords(`${article.title} ${article.summary} ${article.steps.join(' ')}`);
    const matched = queryKeywords.filter((k) =>
      articleKeywords.some((ak) => ak.includes(k) || k.includes(ak)),
    );

    if (matched.length > 0) {
      let score = matched.length * 10;
      // Bonus if the article belongs to the same app
      if (article.appId === appId) {
        score += 25;
      }
      suggestions.push({
        article,
        relevanceScore: score,
        matchedKeywords: matched,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

/**
 * Detects if the requester has already submitted a very similar active ticket
 * in the same application within the last 24 hours.
 */
export function checkDuplicateTicket(
  existingTickets: Ticket[],
  appId: string,
  requesterUid: string,
  subject: string,
  timeWindowMs = 24 * 60 * 60 * 1000,
): Ticket | null {
  if (!subject.trim()) return null;

  const now = Date.now();
  const subjectWords = new Set(extractKeywords(subject));
  if (subjectWords.size === 0) return null;

  for (const ticket of existingTickets) {
    // Only check tickets from the same app and user
    if (ticket.appId !== appId || ticket.requesterUid !== requesterUid) {
      continue;
    }

    // Ignore tickets that are already solved or closed
    if (ticket.status === 'solved' || ticket.status === 'closed') {
      continue;
    }

    // Check time window (created within last 24h)
    const createdMs = Date.parse(ticket.createdAt);
    if (isNaN(createdMs) || now - createdMs > timeWindowMs) {
      continue;
    }

    // Calculate word overlap
    const targetWords = extractKeywords(ticket.subject);
    const overlap = targetWords.filter((w) => subjectWords.has(w));

    if (overlap.length >= 2 || (subjectWords.size === 1 && overlap.length === 1)) {
      return ticket;
    }
  }

  return null;
}
