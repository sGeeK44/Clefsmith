import type { Report } from '@/domain/training/report';
import type { ReportStore } from '@/usecases/keep-report';

/**
 * The report of the last session, held for as long as the application runs.
 *
 * One slot, overwritten: there is no history of reports to keep, and the screen
 * that reads it is opened by the screen that writes it.
 */
export function createMemoryReportStore(): ReportStore {
  let last: Report | undefined;

  return {
    keep: (report) => {
      last = report;
    },
    last: () => last,
  };
}
