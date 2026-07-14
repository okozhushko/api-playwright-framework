import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface RerunPass {
  test: string;
  retry: number;
}

export default class FailOnFlakyReporter implements Reporter {
  private readonly rerunPasses: RerunPass[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' && result.retry > 0) {
      const title = test.titlePath().filter(Boolean).join(' > ');
      this.rerunPasses.push({ test: title, retry: result.retry });
    }
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | void> {
    if (this.rerunPasses.length === 0) return;

    console.error('\nFlaky tests detected (passed on retry):');
    for (const item of this.rerunPasses) {
      console.error(`- ${item.test} (retry=${item.retry})`);
    }
    console.error('Fix the root cause; do not silence with weaker assertions.');

    return { status: 'failed' };
  }
}
