import type { Report } from '@/domain/training/report';

/**
 * Where the report of the session just finished waits for the screen that shows it.
 *
 * It holds one report and it holds it in memory: a report reopened after the
 * application was relaunched has nothing to show, and that is right — a bilan is
 * about the session the learner has just played, not about one they have
 * forgotten. Writing it down would be a second record of a session the
 * progression already counts.
 */
export interface ReportStore {
  keep(report: Report): void;
  last(): Report | undefined;
}

export type KeepReport = (report: Report) => void;
export type RecallReport = () => Report | undefined;

export function createKeepReport(store: ReportStore): KeepReport {
  return (report) => store.keep(report);
}

export function createRecallReport(store: ReportStore): RecallReport {
  return () => store.last();
}
