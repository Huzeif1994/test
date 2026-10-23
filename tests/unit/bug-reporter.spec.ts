import { test, expect } from '@playwright/test';
import { classifyError, findFailedTestsFromReport, extractRealFailure, PlaywrightJsonReport } from '../../scripts/generate-bug-report';

test.describe('Automated Defect Reporter — Unit Test Suite', () => {
  test('should classify 500 / server crash as APPLICATION_BUG with High severity', () => {
    const res = classifyError('Server responded with 500 Internal Server Error');
    expect(res.classification).toBe('APPLICATION_BUG');
    expect(res.suggestedSeverity).toBe('High (Suggested)');
  });

  test('should classify locator drift and strict mode errors as LOCATOR_DRIFT with Medium severity', () => {
    const res = classifyError('Error: strict mode violation: locator(".btn") resolved to 2 elements');
    expect(res.classification).toBe('LOCATOR_DRIFT');
    expect(res.suggestedSeverity).toBe('Medium (Suggested)');
  });

  test('should classify timeout exceedances as TIMEOUT_LATENCY with Medium severity', () => {
    const res = classifyError('Timeout 30000ms exceeded waiting for locator');
    expect(res.classification).toBe('TIMEOUT_LATENCY');
    expect(res.suggestedSeverity).toBe('Medium (Suggested)');
  });

  test('should extract genuine test failure metadata from Playwright JSON report', () => {
    const mockReport: PlaywrightJsonReport = {
      suites: [
        {
          title: 'Ordering Suite',
          file: 'tests/ordering/storefront.spec.ts',
          specs: [
            {
              title: 'Checkout button submission',
              file: 'tests/ordering/storefront.spec.ts',
              line: 42,
              tests: [
                {
                  title: 'Should complete checkout',
                  projectName: 'ordering',
                  results: [
                    {
                      status: 'unexpected',
                      error: {
                        message: 'Locator not found',
                        stack: 'Error: Locator not found\n    at OrderingPage.submit',
                      },
                      attachments: [
                        { name: 'screenshot', contentType: 'image/png', path: 'test-results/shot.png' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const failures = findFailedTestsFromReport(mockReport);
    expect(failures.length).toBe(1);
    expect(failures[0].title).toContain('Checkout button submission › Should complete checkout');
    expect(failures[0].project).toBe('ordering');
    expect(failures[0].line).toBe(42);
    expect(failures[0].attachments.screenshot).toBe('test-results/shot.png');
  });

  test('should return empty array when all tests in report passed', () => {
    const mockReport: PlaywrightJsonReport = {
      suites: [
        {
          title: 'Passed Suite',
          specs: [
            {
              title: 'Successful test',
              file: 'tests/admin/admin.spec.ts',
              line: 10,
              tests: [
                {
                  title: 'Pass',
                  results: [{ status: 'expected' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const failures = findFailedTestsFromReport(mockReport);
    expect(failures.length).toBe(0);
  });
});
