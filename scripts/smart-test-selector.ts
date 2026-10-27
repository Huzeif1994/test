import { execSync, spawnSync } from 'child_process';
import path from 'path';

export interface SelectionResult {
  allTests: boolean;
  projects: Set<string>;
  testFiles: Set<string>;
  changedFiles: string[];
  docsOnly: boolean;
  isGitTrusted: boolean;
  reason: string;
}

/**
 * Normalizes file path to forward slashes
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').trim();
}

export interface GitDiffDetection {
  files: string[];
  isGitTrusted: boolean;
  failureReason?: string;
}

/**
 * Inspects Git diff to determine changed files.
 * If Git history cannot be reliably determined (shallow clone, missing base ref, detached HEAD),
 * flags isGitTrusted = false so callers fail-safe to running all tests.
 */
export function getChangedFiles(): GitDiffDetection {
  const files = new Set<string>();
  let isGitTrusted = true;
  let failureReason: string | undefined;

  // 1. Check uncommitted changes (unstaged and staged)
  try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    for (const line of statusOutput.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const filePath = trimmed.substring(2).trim().split(' -> ').pop()?.trim();
      if (filePath) {
        files.add(normalizePath(filePath));
      }
    }
  } catch (err: any) {
    isGitTrusted = false;
    failureReason = `git status failed: ${err.message}`;
  }

  // 2. Check diff against base branch (main/master) or previous commit
  try {
    let diffTarget = 'HEAD~1';
    let baseRefFound = false;

    // Check GITHUB_BASE_REF in PR runs
    if (process.env.GITHUB_BASE_REF) {
      try {
        execSync(`git rev-parse --verify origin/${process.env.GITHUB_BASE_REF}`, { stdio: 'ignore' });
        diffTarget = `origin/${process.env.GITHUB_BASE_REF}...HEAD`;
        baseRefFound = true;
      } catch {
        // base ref not fetched
      }
    }

    if (!baseRefFound) {
      try {
        execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
        diffTarget = 'origin/main...HEAD';
        baseRefFound = true;
      } catch {
        try {
          execSync('git rev-parse --verify main', { stdio: 'ignore' });
          diffTarget = 'main...HEAD';
          baseRefFound = true;
        } catch {
          diffTarget = 'HEAD~1';
        }
      }
    }

    const diffOutput = execSync(`git diff --name-only ${diffTarget}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    for (const file of diffOutput.split('\n')) {
      const clean = normalizePath(file);
      if (clean) files.add(clean);
    }
  } catch (err: any) {
    // In CI or shallow clones, if commit history is truncated (--depth=1), git diff fails
    if (process.env.CI) {
      isGitTrusted = false;
      failureReason = `git diff failed in CI (possible shallow clone or missing base commit): ${err.message}`;
    }
  }

  return {
    files: Array.from(files),
    isGitTrusted,
    failureReason,
  };
}

/**
 * Core Predictive Selector Rule Engine
 */
export function selectTests(
  changedFiles: string[],
  options: { isGitTrusted?: boolean; failureReason?: string } = {}
): SelectionResult {
  const isGitTrusted = options.isGitTrusted ?? true;
  const projects = new Set<string>();
  const testFiles = new Set<string>();
  const allProjectsList = ['ordering', 'fulfillment', 'admin', 'e2e-bridge'];

  // Fail-Safe: If Git state is untrusted (shallow clone, missing commits, git errors), run all tests
  if (!isGitTrusted) {
    return {
      allTests: true,
      projects: new Set(allProjectsList),
      testFiles: new Set(['tests/']),
      changedFiles,
      docsOnly: false,
      isGitTrusted: false,
      reason: `Git change calculation is uncertain (${options.failureReason || 'truncated commit history'}). Defaulting to full test suite for fail-safe safety.`,
    };
  }

  if (changedFiles.length === 0) {
    return {
      allTests: false,
      projects,
      testFiles,
      changedFiles,
      docsOnly: false,
      isGitTrusted: true,
      reason: 'No changed files detected in Git.',
    };
  }

  // 1. Global infrastructure or Shared Architecture changes -> Full Suite
  const globalOrSharedPatterns = [
    'playwright.config.ts',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'Dockerfile',
    'docker-compose.yml',
    'config/',
    'fixtures/',
    'pages/BasePage.ts',
    'utils/',
    '.github/',
    'tests/setup/',
  ];

  for (const file of changedFiles) {
    const matchedGlobal = globalOrSharedPatterns.find(p => file.includes(p));
    if (matchedGlobal) {
      return {
        allTests: true,
        projects: new Set(allProjectsList),
        testFiles: new Set(['tests/']),
        changedFiles,
        docsOnly: false,
        isGitTrusted: true,
        reason: `Shared architectural dependency or global infrastructure changed: ${file}`,
      };
    }
  }

  // 2. Documentation-only check
  const isDocFile = (f: string) =>
    f.endsWith('.md') ||
    f.endsWith('.txt') ||
    f.startsWith('docs/') ||
    f === '.gitignore' ||
    f === 'LICENSE';

  const nonDocFiles = changedFiles.filter(f => !isDocFile(f));
  if (nonDocFiles.length === 0) {
    return {
      allTests: false,
      projects,
      testFiles,
      changedFiles,
      docsOnly: true,
      isGitTrusted: true,
      reason: 'Only documentation or repository metadata files changed (no code changes).',
    };
  }

  // 3. Domain and application mapping
  let hasUnmappedCode = false;
  let unmappedFile = '';

  for (const file of nonDocFiles) {
    let matched = false;

    // Online Ordering domain
    if (file.includes('pages/ordering') || file.includes('tests/ordering') || file.includes('auth.ordering.setup')) {
      projects.add('ordering');
      projects.add('e2e-bridge');
      testFiles.add('tests/ordering/');
      testFiles.add('tests/e2e-bridge/');
      matched = true;
    }

    // Operations Fulfillment domain
    if (file.includes('pages/fulfillment') || file.includes('tests/fulfillment') || file.includes('auth.fulfillment.setup')) {
      projects.add('fulfillment');
      projects.add('e2e-bridge');
      testFiles.add('tests/fulfillment/');
      testFiles.add('tests/e2e-bridge/');
      matched = true;
    }

    // Merchant Admin domain
    if (file.includes('pages/admin') || file.includes('tests/admin') || file.includes('auth.admin.setup')) {
      projects.add('admin');
      testFiles.add('tests/admin/');
      matched = true;
    }

    // Cross-App Bridge domain
    if (file.includes('tests/e2e-bridge')) {
      projects.add('e2e-bridge');
      testFiles.add('tests/e2e-bridge/');
      matched = true;
    }

    // Standalone unit tests
    if (file.includes('tests/unit/')) {
      testFiles.add('tests/unit/');
      matched = true;
    }

    // Internal scripts
    if (file.includes('scripts/')) {
      projects.add('admin'); // smoke validation
      matched = true;
    }

    // Agile user stories and generated test plans
    if (file.includes('user-stories/') || file.includes('test-plans/') || file.includes('tests/generated/')) {
      projects.add('generated');
      projects.add('ordering');
      projects.add('fulfillment');
      projects.add('e2e-bridge');
      testFiles.add('tests/generated/');
      matched = true;
    }

    // API Fixtures
    if (file.includes('api/') || file.includes('schemas/')) {
      projects.add('ordering');
      projects.add('fulfillment');
      matched = true;
    }

    if (!matched) {
      hasUnmappedCode = true;
      unmappedFile = file;
    }
  }

  // 4. Fail-Safe Fallback: If any code change is unmapped, default to full suite
  if (hasUnmappedCode) {
    return {
      allTests: true,
      projects: new Set(allProjectsList),
      testFiles: new Set(['tests/']),
      changedFiles,
      docsOnly: false,
      isGitTrusted: true,
      reason: `Unmapped source file detected (${unmappedFile}). Defaulting to full test suite for fail-safe safety.`,
    };
  }

  return {
    allTests: false,
    projects,
    testFiles,
    changedFiles,
    docsOnly: false,
    isGitTrusted: true,
    reason: `Targeted tests mapped for ${nonDocFiles.length} application source file(s).`,
  };
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldRun = args.includes('--run');
  const asJson = args.includes('--json');
  const isHeaded = args.includes('--headed');

  const diffResult = getChangedFiles();
  const selection = selectTests(diffResult.files, {
    isGitTrusted: diffResult.isGitTrusted,
    failureReason: diffResult.failureReason,
  });

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          allTests: selection.allTests,
          projects: Array.from(selection.projects),
          testFiles: Array.from(selection.testFiles),
          changedFiles: selection.changedFiles,
          docsOnly: selection.docsOnly,
          isGitTrusted: selection.isGitTrusted,
          reason: selection.reason,
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  console.log('\n==================================================');
  console.log('🎯 SMART TEST SELECTOR — Predictive Playwright Runner');
  console.log('==================================================');
  console.log(`📋 Changed Files Detected (${diffResult.files.length}):`);
  diffResult.files.forEach(f => console.log(`   - ${f}`));
  console.log('--------------------------------------------------');
  console.log(`💡 Reason: ${selection.reason}`);
  console.log(`🚀 Selected Projects: ${Array.from(selection.projects).join(', ') || 'None'}`);
  console.log(`📁 Selected Test Targets: ${Array.from(selection.testFiles).join(', ') || 'None'}`);
  console.log('==================================================\n');

  if (selection.docsOnly) {
    console.log('✨ Documentation change only. Code execution bypassed.');
    process.exit(0);
  }

  if (selection.testFiles.size === 0 && !selection.allTests) {
    console.log('ℹ️  No test execution required for these changes.');
    process.exit(0);
  }

  if (shouldRun) {
    const playwrightArgs = ['test'];

    if (selection.allTests) {
      // Run full suite
    } else {
      for (const p of selection.projects) {
        playwrightArgs.push(`--project=${p}`);
      }
    }

    if (isHeaded) {
      playwrightArgs.push('--headed');
    }

    // Forward any extra passthrough arguments
    for (const arg of args) {
      if (!['--run', '--json', '--headed', '--list'].includes(arg)) {
        playwrightArgs.push(arg);
      }
    }

    console.log(`Executing: npx playwright ${playwrightArgs.join(' ')}\n`);
    const result = spawnSync('npx', ['playwright', ...playwrightArgs], {
      stdio: 'inherit',
      shell: true,
    });
    process.exit(result.status ?? 0);
  } else {
    console.log('ℹ️  Dry run only. To execute targeted tests, run with: --run');
    console.log(`   Example: npx tsx scripts/smart-test-selector.ts --run\n`);
  }
}
