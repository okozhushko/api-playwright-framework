/* eslint-disable no-console -- Reporter writes to stderr by design, not app-level logging */
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface RerunPass {
  test: string;
  retry: number;
  reason?: string;
}

export default class FailOnFlakyReporter implements Reporter {
  private readonly rerunPasses: RerunPass[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' && result.retry > 0) {
      const title = test.titlePath().filter(Boolean).join(' > ');
      const failedAttempt = test.results[result.retry - 1];
      this.rerunPasses.push({
        test: title,
        retry: result.retry,
        reason: failedAttempt?.error?.message,
      });
    }
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | void> {
    if (this.rerunPasses.length === 0) return;

    console.error('\nFlaky tests detected (passed on retry):');
    for (const item of this.rerunPasses) {
      console.error(`- ${item.test} (retry=${item.retry})`);
      if (item.reason) {
        for (const line of item.reason.split('\n')) {
          console.error(`  ${line}`);
        }
      }
    }
    console.error('Fix the root cause; do not silence with weaker assertions.');

    return { status: 'failed' };
  }
}
