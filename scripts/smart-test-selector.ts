import { execSync, spawnSync } from 'child_process';
import path from 'path';

interface SelectionResult {
  allTests: boolean;
  projects: Set<string>;
  testFiles: Set<string>;
  changedFiles: string[];
  reason: string;
}

/**
 * Smart Test Selector
 * Inspects Git diff to determine exactly which Playwright projects & specs to execute.
 */
export function getChangedFiles(): string[] {
  const files = new Set<string>();

  // 1. Check uncommitted changes (unstaged and staged)
  try {
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
    for (const line of statusOutput.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Format is "XY filename" or "XY old -> new"
      const filePath = trimmed.substring(2).trim().split(' -> ').pop()?.trim();
      if (filePath) {
        files.add(filePath.replace(/\\/g, '/'));
      }
    }
  } catch {
    // Non-fatal if git status fails
  }

  // 2. Check diff against base branch (main/master) or previous commit
  try {
    // Try origin/main or main or HEAD~1
    let diffTarget = 'HEAD~1';
    try {
      execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
      diffTarget = 'origin/main...HEAD';
    } catch {
      try {
        execSync('git rev-parse --verify main', { stdio: 'ignore' });
        diffTarget = 'main...HEAD';
      } catch {
        diffTarget = 'HEAD~1';
      }
    }

    const diffOutput = execSync(`git diff --name-only ${diffTarget}`, { encoding: 'utf-8' });
    for (const file of diffOutput.split('\n')) {
      const clean = file.trim().replace(/\\/g, '/');
      if (clean) files.add(clean);
    }
  } catch {
    // Non-fatal if no commits yet
  }

  return Array.from(files);
}

export function selectTests(changedFiles: string[]): SelectionResult {
  const projects = new Set<string>();
  const testFiles = new Set<string>();

  if (changedFiles.length === 0) {
    return {
      allTests: false,
      projects,
      testFiles,
      changedFiles,
      reason: 'No changed files detected in Git.',
    };
  }

  // Infrastructure / Global configs trigger full test suite
  const globalPatterns = [
    'playwright.config.ts',
    'package.json',
    'package-lock.json',
    'Dockerfile',
    'docker-compose.yml',
    'config/environment.ts',
    '.github/',
  ];

  for (const file of changedFiles) {
    if (globalPatterns.some(p => file.includes(p))) {
      return {
        allTests: true,
        projects: new Set(['ordering', 'fulfillment', 'admin', 'e2e-bridge']),
        testFiles: new Set(['tests/']),
        changedFiles,
        reason: `Global configuration or infrastructure changed: ${file}`,
      };
    }
  }

  for (const file of changedFiles) {
    // Ordering changes
    if (file.includes('pages/ordering') || file.includes('tests/ordering')) {
      projects.add('ordering');
      projects.add('e2e-bridge');
      testFiles.add('tests/ordering/');
      testFiles.add('tests/e2e-bridge/');
    }

    // Fulfillment changes
    if (file.includes('pages/fulfillment') || file.includes('tests/fulfillment')) {
      projects.add('fulfillment');
      projects.add('e2e-bridge');
      testFiles.add('tests/fulfillment/');
      testFiles.add('tests/e2e-bridge/');
    }

    // Admin changes
    if (file.includes('pages/admin') || file.includes('tests/admin')) {
      projects.add('admin');
      testFiles.add('tests/admin/');
    }

    // Direct E2E bridge changes
    if (file.includes('tests/e2e-bridge')) {
      projects.add('e2e-bridge');
      testFiles.add('tests/e2e-bridge/');
    }
  }

  return {
    allTests: false,
    projects,
    testFiles,
    changedFiles,
    reason: `Targeted tests mapped for ${changedFiles.length} changed file(s).`,
  };
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldRun = args.includes('--run');
  const asJson = args.includes('--json');
  const isHeaded = args.includes('--headed');

  const changed = getChangedFiles();
  const selection = selectTests(changed);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          allTests: selection.allTests,
          projects: Array.from(selection.projects),
          testFiles: Array.from(selection.testFiles),
          changedFiles: selection.changedFiles,
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
  console.log(`📋 Changed Files Detected (${changed.length}):`);
  changed.forEach(f => console.log(`   - ${f}`));
  console.log('--------------------------------------------------');
  console.log(`💡 Reason: ${selection.reason}`);
  console.log(`🚀 Selected Projects: ${Array.from(selection.projects).join(', ') || 'None'}`);
  console.log(`📁 Selected Test Targets: ${Array.from(selection.testFiles).join(', ') || 'None'}`);
  console.log('==================================================\n');

  if (selection.testFiles.size === 0 && !selection.allTests) {
    console.log('✨ No tests required for the changed files.');
    process.exit(0);
  }

  if (shouldRun) {
    const playwrightArgs = ['test'];

    if (selection.allTests) {
      // Run all
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

