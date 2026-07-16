/**
 * Recalculation helpers: grade, position, class average, teacher remark.
 * Called on result finalize (and on the fly for preview).
 */
import { calculateGrade, gradeRemark } from './constants';
import type { ResultItem } from '@prisma/client';

/**
 * Total of (A) Test1 + (B) Test2 + (C) Exam  -> column (D) "Total Incl. H.W."
 */
export function computeTotal(item: Pick<ResultItem, 'test1' | 'test2' | 'exam'>): number | null {
  const { test1, test2, exam } = item;
  if (test1 == null && test2 == null && exam == null) return null;
  return (test1 ?? 0) + (test2 ?? 0) + (exam ?? 0);
}

/**
 * Cumulative total across terms = firstTerm + secondTerm + thirdTerm (if available),
 * else just current term total.
 */
export function computeCumulativeTotal(item: ResultItem): number | null {
  const t = computeTotal(item);
  const first = item.firstTermScore ?? 0;
  const second = item.secondTermScore ?? 0;
  const third = item.thirdTermScore ?? 0;
  if (first || second || third) {
    return first + second + third;
  }
  return t;
}

/**
 * For a list of students' totals in a single subject, compute:
 * - the class average (mean)
 * - each student's position (1 = highest)
 */
export function computePositionsAndAverage(
  totals: { studentId: string; total: number | null }[]
): {
  positions: Record<string, number>;
  average: number;
} {
  const valid = totals.filter((t) => t.total != null) as { studentId: string; total: number }[];
  const sum = valid.reduce((a, b) => a + b.total, 0);
  const average = valid.length > 0 ? sum / valid.length : 0;

  // Sort descending and assign positions (ties get same rank)
  const sorted = [...valid].sort((a, b) => b.total - a.total);
  const positions: Record<string, number> = {};
  let lastScore: number | null = null;
  let lastPos = 0;
  sorted.forEach((entry, idx) => {
    if (lastScore === null || entry.total !== lastScore) {
      lastPos = idx + 1;
      lastScore = entry.total;
    }
    positions[entry.studentId] = lastPos;
  });
  return { positions, average };
}

export { calculateGrade, gradeRemark };
