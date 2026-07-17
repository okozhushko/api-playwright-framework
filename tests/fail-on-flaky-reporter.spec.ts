import { test, expect } from '@playwright/test';
import FailOnFlakyReporter from '@utils/fail-on-flaky-reporter';
import type { TestCase, TestResult } from '@playwright/test/reporter';

const createFakeTestCase = (titles: string[]): TestCase =>
  ({
    titlePath: () => titles,
  }) as TestCase;

const createFakeTestResult = (status: 'passed' | 'failed' | 'skipped', retry = 0): TestResult =>
  ({
    status,
    retry,
  }) as TestResult;

test.describe('FailOnFlakyReporter', () => {
  test('ignores test passes without retry', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['Suite', 'Test 1']);
    const result = createFakeTestResult('passed', 0);

    reporter.onTestEnd(testCase, result);
    const output = await reporter.onEnd();

    expect(output).toBeUndefined();
  });

  test('ignores test failures', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['Suite', 'Test 2']);
    const result = createFakeTestResult('failed', 2);

    reporter.onTestEnd(testCase, result);
    const output = await reporter.onEnd();

    expect(output).toBeUndefined();
  });

  test('ignores test skips', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['Suite', 'Test 3']);
    const result = createFakeTestResult('skipped', 1);

    reporter.onTestEnd(testCase, result);
    const output = await reporter.onEnd();

    expect(output).toBeUndefined();
  });

  test('records test passes on retry', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['Suite', 'Flaky Test']);
    const result = createFakeTestResult('passed', 1);

    reporter.onTestEnd(testCase, result);
    const output = await reporter.onEnd();

    expect(output).toEqual({ status: 'failed' });
  });

  test('records multiple flaky tests', async () => {
    const reporter = new FailOnFlakyReporter();

    reporter.onTestEnd(createFakeTestCase(['Suite', 'Flaky 1']), createFakeTestResult('passed', 1));
    reporter.onTestEnd(createFakeTestCase(['Suite', 'Flaky 2']), createFakeTestResult('passed', 2));
    reporter.onTestEnd(createFakeTestCase(['Suite', 'Clean']), createFakeTestResult('passed', 0));

    const output = await reporter.onEnd();

    expect(output).toEqual({ status: 'failed' });
  });

  test('builds correct title path from nested test titles', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['API', 'Users', 'creates a user']);
    const result = createFakeTestResult('passed', 1);

    // Capture console.error to verify title format
    let capturedError = '';
    // eslint-disable-next-line no-console -- Testing error output behavior
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console -- Testing error output behavior
    console.error = (msg: string) => {
      capturedError += msg;
    };

    try {
      reporter.onTestEnd(testCase, result);
      await reporter.onEnd();

      expect(capturedError).toContain('API > Users > creates a user (retry=1)');
    } finally {
      // eslint-disable-next-line no-console -- Testing error output behavior
      console.error = originalConsoleError;
    }
  });

  test('filters out empty strings from title path', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['API', '', 'Users', '', 'test']);
    const result = createFakeTestResult('passed', 1);

    let capturedError = '';
    // eslint-disable-next-line no-console -- Testing error output behavior
    const originalConsoleError = console.error;
    // eslint-disable-next-line no-console -- Testing error output behavior
    console.error = (msg: string) => {
      capturedError += msg;
    };

    try {
      reporter.onTestEnd(testCase, result);
      await reporter.onEnd();

      expect(capturedError).toContain('API > Users > test (retry=1)');
    } finally {
      // eslint-disable-next-line no-console -- Testing error output behavior
      console.error = originalConsoleError;
    }
  });

  test('returns failed status on detection of flaky test', async () => {
    const reporter = new FailOnFlakyReporter();
    const testCase = createFakeTestCase(['Test Suite', 'Flaky Test']);
    const result = createFakeTestResult('passed', 3);

    reporter.onTestEnd(testCase, result);
    const output = await reporter.onEnd();

    expect(output?.status).toBe('failed');
  });
});
