import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

export interface FailureDiagnosis {
  specFile?: string;
  pageObjectFile?: string;
  lineNumber?: number;
  failedLocator?: string;
  errorType: 'LOCATOR_NOT_FOUND' | 'TIMEOUT_DRIFT' | 'STRICT_MODE_VIOLATION' | 'UNKNOWN';
  rawMessage: string;
}

export function parsePlaywrightFailureOutput(output: string): FailureDiagnosis {
  let specFile: string | undefined;
  let pageObjectFile: string | undefined;
  let lineNumber: number | undefined;
  let failedLocator: string | undefined;
  let errorType: FailureDiagnosis['errorType'] = 'UNKNOWN';

  // 1. Detect error types
  if (/strict mode violation/i.test(output)) {
    errorType = 'STRICT_MODE_VIOLATION';
  } else if (/Timeout.*waiting for locator/i.test(output) || /locator\.waitFor: Timeout/i.test(output)) {
    errorType = 'TIMEOUT_DRIFT';
  } else if (/locator\..*element not found/i.test(output)) {
    errorType = 'LOCATOR_NOT_FOUND';
  }

  // 2. Extract failed locator string
  const locatorMatch = output.match(/waiting for locator\((.+?)\)\s+to be/i) ||
                       output.match(/waiting for locator\((.+?)\)/i) ||
                       output.match(/locator\((['"][^)]+['"])\)/i);
  if (locatorMatch) {
    let raw = (locatorMatch[1] || '').trim();
    // Strip leading/trailing matching quotes if any
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      raw = raw.slice(1, -1);
    }
    failedLocator = raw.trim();
  }

  // 3. Extract Page Object and Line Number
  const poLineMatch = output.match(/at\s+.*[/\\](pages[/\\][^:]+\.ts):(\d+):(\d+)/i) ||
                      output.match(/at\s+.*[(](pages[/\\][^:]+\.ts):(\d+):(\d+)/i) ||
                      output.match(/(pages[/\\][^:]+\.ts):(\d+):(\d+)/i);
  if (poLineMatch) {
    pageObjectFile = poLineMatch[1].replace(/\\/g, '/');
    lineNumber = parseInt(poLineMatch[2], 10);
  }

  // 4. Extract Spec File
  const specMatch = output.match(/at\s+.*[/\\](tests[/\\][^:]+\.spec\.ts):(\d+):(\d+)/i) ||
                    output.match(/(\[.+\]\s+›\s+(tests[/\\][^\s:]+\.spec\.ts))/i);
  if (specMatch) {
    specFile = (specMatch[1] || specMatch[2]).replace(/\\/g, '/');
  }

  return {
    specFile,
    pageObjectFile,
    lineNumber,
    failedLocator,
    errorType,
    rawMessage: output.slice(0, 1000),
  };
}

export function generateResilientAlternativeLocators(failedLocator: string): string[] {
  const alternatives: string[] = [];

  // Heuristic 1: If strict text match like `button:has-text("...")` or `text=...`
  const textMatch = failedLocator.match(/has-text\(["']([^"']+)["']\)|text=["']?([^"'\)]+)["']?/i);
  if (textMatch) {
    const rawText = (textMatch[1] || textMatch[2]).trim();
    // Safe regex-based locator matching Quasar buttons and standard controls
    alternatives.push(`locator('button, a, .q-btn, [role="button"]').filter({ hasText: /${rawText}/i }).first()`);
    alternatives.push(`getByRole('button', { name: /${rawText}/i }).first()`);
    alternatives.push(`locator('div, span, label, p').filter({ hasText: /${rawText}/i }).first()`);
  }

  // Heuristic 2: Toggle / switch controls
  if (/toggle|switch|pay at store/i.test(failedLocator)) {
    alternatives.push(`locator('.q-toggle, [role="switch"], .ftx-toggle').first()`);
    alternatives.push(`locator('div, label').filter({ hasText: /Pay At Store/i }).locator('..').locator('.q-toggle, [role="switch"]').first()`);
  }

  // Heuristic 3: Strict mode violation (multiple matches) -> append .first()
  if (!failedLocator.includes('.first()') && !failedLocator.includes('nth(')) {
    alternatives.push(`${failedLocator}.first()`);
  }

  // Heuristic 4: Quasar input / select boxes
  if (/input|select|combobox/i.test(failedLocator)) {
    alternatives.push(`locator('.q-field input, .q-select input, [role="combobox"]').first()`);
  }

  return Array.from(new Set(alternatives));
}

export function patchPageObjectFile(poRelativePath: string, oldLocator: string, newLocator: string): boolean {
  const fullPoPath = path.resolve(poRelativePath);
  if (!fs.existsSync(fullPoPath)) {
    console.warn(`[AI-HEAL] Target Page Object file not found: ${fullPoPath}`);
    return false;
  }

  const content = fs.readFileSync(fullPoPath, 'utf8');
  if (!content.includes(oldLocator)) {
    console.warn(`[AI-HEAL] Old locator not found in Page Object file: "${oldLocator}"`);
    return false;
  }

  const patched = content.replace(oldLocator, newLocator);
  fs.writeFileSync(fullPoPath, patched, 'utf8');
  console.log(`🔧 [AI-HEAL] Patched locator in ${poRelativePath}`);
  console.log(`   - FROM: ${oldLocator}`);
  console.log(`   - TO:   ${newLocator}`);
  return true;
}

export function healFailingTest(specPath: string): { success: boolean; message: string } {
  console.log(`🩺 [AI-HEAL] Running diagnostic run on test: ${specPath}...`);

  // Step 1: Run test to capture genuine failure
  const run = spawnSync('npx', ['playwright', 'test', specPath, '--reporter=list'], {
    encoding: 'utf8',
    shell: true,
  });

  if (run.status === 0) {
    console.log(`✅ [AI-HEAL] Test passed cleanly without healing required!`);
    return { success: true, message: 'Test is already passing.' };
  }

  const fullOutput = (run.stdout || '') + '\n' + (run.stderr || '');
  const diagnosis = parsePlaywrightFailureOutput(fullOutput);

  console.log(`🔍 [AI-HEAL] Diagnosis Results:`);
  console.log(`   Error Type: ${diagnosis.errorType}`);
  console.log(`   Page Object: ${diagnosis.pageObjectFile || 'Not identified'}`);
  console.log(`   Line: ${diagnosis.lineNumber || 'Unknown'}`);
  console.log(`   Failed Locator: ${diagnosis.failedLocator || 'Not isolated'}`);

  if (!diagnosis.pageObjectFile || !diagnosis.failedLocator) {
    return {
      success: false,
      message: 'Could not isolate Page Object or failed locator from Playwright stack trace.',
    };
  }

  const candidateLocators = generateResilientAlternativeLocators(diagnosis.failedLocator);
  console.log(`💡 [AI-HEAL] Generated ${candidateLocators.length} resilient locator candidate(s)`);

  const fullPoPath = path.resolve(diagnosis.pageObjectFile);
  const originalPoContent = fs.readFileSync(fullPoPath, 'utf8');

  for (let i = 0; i < candidateLocators.length; i++) {
    const candidate = candidateLocators[i];
    console.log(`🔄 [AI-HEAL] Attempting candidate [${i + 1}/${candidateLocators.length}]: ${candidate}`);

    const patched = patchPageObjectFile(diagnosis.pageObjectFile, diagnosis.failedLocator, candidate);
    if (!patched) continue;

    // Validate with quick retry
    const verifyRun = spawnSync('npx', ['playwright', 'test', specPath, '--reporter=list'], {
      encoding: 'utf8',
      shell: true,
    });

    if (verifyRun.status === 0) {
      console.log(`🎉 [AI-HEAL] SUCCESS! Test passed after applying candidate ${i + 1}`);
      return {
        success: true,
        message: `Self-healed ${diagnosis.pageObjectFile} using resilient locator candidate ${i + 1}`,
      };
    } else {
      console.log(`⚠️ Candidate ${i + 1} did not resolve failure; reverting...`);
      fs.writeFileSync(fullPoPath, originalPoContent, 'utf8');
    }
  }

  // Restore original if no candidate succeeded
  fs.writeFileSync(fullPoPath, originalPoContent, 'utf8');
  return {
    success: false,
    message: 'All self-healing candidates failed to resolve test. Genuine defect or backend failure.',
  };
}

// CLI Execution Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`Usage: npm run test:heal -- <path-to-test.spec.ts>`);
    process.exit(1);
  }

  const targetSpec = args[0];
  const result = healFailingTest(targetSpec);
  if (!result.success) {
    console.error(`❌ [AI-HEAL] ${result.message}`);
    process.exit(1);
  } else {
    console.log(`✅ [AI-HEAL] ${result.message}`);
    process.exit(0);
  }
}
