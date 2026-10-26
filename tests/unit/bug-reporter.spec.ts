import { test, expect } from '@playwright/test';
import {
  classifyError,
  findFailedTestsFromReport,
  computeBlastRadius,
  generateExecutiveQualitySummary,
  generateJiraPayload,
  BugReportData,
} from '../../scripts/generate-bug-report';

test.describe('Automated Defect Reporter & Blast Radius Triage — Unit Test Suite', () => {
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

  test('should classify pre-flight outages and gateway errors as ENVIRONMENT_ISSUE with High severity', () => {
    const res = classifyError('🛑 [PRE-FLIGHT OUTAGE] Online Ordering Storefront is UNREACHABLE: ECONNREFUSED');
    expect(res.classification).toBe('ENVIRONMENT_ISSUE');
    expect(res.suggestedSeverity).toBe('High (Suggested)');
  });

  test('should compute blast radius risk accurately based on defect classifications', () => {
    // Clean run
    const clean = computeBlastRadius([]);
    expect(clean.riskLevel).toBe('CLEAN');

    // UI drift (cosmetic)
    const uiFailure: BugReportData = {
      title: 'Checkout button',
      project: 'ordering',
      specPath: 'tests/ordering/checkout.spec.ts',
      classification: 'LOCATOR_DRIFT',
      suggestedSeverity: 'Medium (Suggested)',
      errorMessage: 'locator not found',
      reproCommand: 'npx playwright test',
      steps: [],
      expected: '',
      actual: '',
    };
    const lowRisk = computeBlastRadius([uiFailure]);
    expect(lowRisk.riskLevel).toBe('LOW_MAINTENANCE');
    expect(lowRisk.recommendation).toContain('npm run test:heal');

    // Application 500 / crash
    const appFailure: BugReportData = {
      ...uiFailure,
      classification: 'APPLICATION_BUG',
      suggestedSeverity: 'High (Suggested)',
      errorMessage: '500 Internal Server Error',
    };
    const criticalRisk = computeBlastRadius([appFailure]);
    expect(criticalRisk.riskLevel).toBe('CRITICAL_BLOCKER');
    expect(criticalRisk.headline).toContain('Release Blocker');
  });

  test('should generate rich Executive Quality Summary markdown table for CI', () => {
    const failure: BugReportData = {
      title: 'Curbside Arrival Submission',
      project: 'e2e-bridge',
      specPath: 'tests/e2e-bridge/flow2.spec.ts',
      classification: 'TIMEOUT_LATENCY',
      suggestedSeverity: 'Medium (Suggested)',
      errorMessage: 'Timeout waiting for arrival button',
      reproCommand: 'npx playwright test tests/e2e-bridge/flow2.spec.ts',
      steps: [],
      expected: 'Arrival modal submitted',
      actual: 'Timeout',
    };

    const summaryMd = generateExecutiveQualitySummary([failure]);
    expect(summaryMd).toContain('## 🛡️ Executive QA Quality & Blast Radius Triage');
    expect(summaryMd).toContain('ELEVATED_RISK');
    expect(summaryMd).toContain('`e2e-bridge`');
    expect(summaryMd).toContain('`TIMEOUT_LATENCY`');
  });

  test('should generate structured Jira REST API defect payload', () => {
    const failure: BugReportData = {
      title: 'Store Pickup Handover Failure',
      project: 'fulfillment',
      specPath: 'tests/fulfillment/handover.spec.ts',
      classification: 'APPLICATION_BUG',
      suggestedSeverity: 'High (Suggested)',
      errorMessage: 'Internal Server Error 500 during order status transition',
      reproCommand: 'npx playwright test tests/fulfillment/handover.spec.ts',
      steps: ['Step 1', 'Step 2'],
      expected: 'Status Fulfilled',
      actual: 'Error 500',
    };

    const jiraPayload: any = generateJiraPayload(failure);
    expect(jiraPayload.fields.project.key).toBe('FTX');
    expect(jiraPayload.fields.summary).toBe('[BUG][FULFILLMENT] Store Pickup Handover Failure');
    expect(jiraPayload.fields.issuetype.name).toBe('Bug');
    expect(jiraPayload.fields.priority.name).toBe('High');
  });
});
