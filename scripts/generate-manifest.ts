import fs from 'fs';
import path from 'path';

export interface TestManifestEntry {
  id: string;
  title: string;
  file: string;
  project: string;
  module: string;
  suite: 'smoke' | 'regression' | 'e2e' | 'release-critical';
  priority: 'blocker' | 'critical' | 'normal' | 'minor';
  tags: string[];
  dependencies: string[];
  estimatedDurationMs: number;
}

export interface TestManifest {
  version: string;
  generatedAt: string;
  summary: {
    totalTests: number;
    suites: Record<string, number>;
    projects: Record<string, number>;
    priorities: Record<string, number>;
  };
  tests: TestManifestEntry[];
}

/**
 * Normalizes file path to forward slashes
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').trim();
}

/**
 * Extracts tags from a test title (e.g. "Customer places order @ordering @checkout")
 */
export function extractTags(text: string): string[] {
  const matches = text.match(/@[a-zA-Z0-9_-]+/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Derives module domain from file path and tags
 */
export function deriveModule(file: string, tags: string[]): string {
  const lowerFile = file.toLowerCase();
  const lowerTags = tags.map(t => t.toLowerCase());

  if (lowerTags.includes('@giftcard') || lowerFile.includes('gift-card')) return 'giftcard';
  if (lowerTags.includes('@checkout') || lowerFile.includes('checkout')) return 'checkout';
  if (lowerTags.includes('@catalog') || lowerFile.includes('catalog')) return 'catalog';
  if (lowerTags.includes('@cart') || lowerFile.includes('cart')) return 'cart';
  if (lowerTags.includes('@staging') || lowerFile.includes('staging')) return 'staging';
  if (lowerTags.includes('@handover') || lowerFile.includes('handover')) return 'handover';
  if (lowerTags.includes('@picking') || lowerFile.includes('picking')) return 'picking';
  if (lowerTags.includes('@orders') || lowerFile.includes('orders')) return 'orders';
  if (lowerTags.includes('@auth') || lowerFile.includes('auth')) return 'auth';

  if (lowerFile.includes('ordering')) return 'storefront';
  if (lowerFile.includes('fulfillment')) return 'fulfillment';
  if (lowerFile.includes('admin')) return 'admin';
  return 'general';
}

/**
 * Derives test suite classification from tags and project
 */
export function deriveSuite(tags: string[], project: string, title: string): 'smoke' | 'regression' | 'e2e' | 'release-critical' {
  const lower = (title + ' ' + tags.join(' ')).toLowerCase();
  if (project === 'e2e-bridge' || lower.includes('@bridge') || lower.includes('@flow1') || lower.includes('@flow2') || lower.includes('cross-app')) {
    return 'e2e';
  }
  if (lower.includes('@smoke') || lower.includes('smoke')) {
    return 'smoke';
  }
  if (lower.includes('@critical') || lower.includes('@blocker') || lower.includes('checkout') || lower.includes('handover')) {
    return 'release-critical';
  }
  return 'regression';
}

/**
 * Derives priority from suite and tags
 */
export function derivePriority(suite: string, tags: string[], title: string): 'blocker' | 'critical' | 'normal' | 'minor' {
  const lower = (title + ' ' + tags.join(' ')).toLowerCase();
  if (suite === 'e2e' || lower.includes('@blocker') || lower.includes('handover') || lower.includes('places order')) {
    return 'blocker';
  }
  if (suite === 'release-critical' || lower.includes('@critical') || lower.includes('checkout')) {
    return 'critical';
  }
  if (lower.includes('@minor')) {
    return 'minor';
  }
  return 'normal';
}

/**
 * Generates test manifest by scanning spec files
 */
export function generateManifest(testsDir: string = './tests'): TestManifest {
  const manifestTests: TestManifestEntry[] = [];
  const projectCounters: Record<string, number> = {
    ordering: 0,
    fulfillment: 0,
    admin: 0,
    'e2e-bridge': 0,
    generated: 0,
    setup: 0,
  };

  const projectDeps: Record<string, string[]> = {
    ordering: ['setup-preflight', 'setup-ordering'],
    fulfillment: ['setup-preflight', 'setup-fulfillment'],
    admin: ['setup-preflight', 'setup-admin'],
    'e2e-bridge': ['setup-preflight', 'setup-ordering', 'setup-fulfillment'],
    generated: ['setup-preflight', 'setup-ordering'],
  };

  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'unit' && entry.name !== 'node_modules') {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.setup.ts'))) {
        parseTestFile(fullPath);
      }
    }
  }

  function parseTestFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = normalizePath(path.relative(process.cwd(), filePath));
    
    // Determine project
    let project = 'general';
    if (relPath.includes('tests/ordering')) project = 'ordering';
    else if (relPath.includes('tests/fulfillment')) project = 'fulfillment';
    else if (relPath.includes('tests/admin')) project = 'admin';
    else if (relPath.includes('tests/e2e-bridge')) project = 'e2e-bridge';
    else if (relPath.includes('tests/generated')) project = 'generated';
    else if (relPath.includes('tests/setup')) project = 'setup';

    // Regex to match test('title', ...) or setup('title', ...)
    const testPattern = /(?:test|setup)\s*\(\s*['"`]([\s\S]*?)['"`]\s*,\s*async/g;
    let match: RegExpExecArray | null;

    while ((match = testPattern.exec(content)) !== null) {
      const rawTitle = match[1].replace(/\s+/g, ' ').trim();
      const tags = extractTags(rawTitle);
      const cleanTitle = rawTitle.replace(/@[a-zA-Z0-9_-]+/g, '').replace(/\s+/g, ' ').trim();

      projectCounters[project] = (projectCounters[project] || 0) + 1;
      const count = projectCounters[project];

      // Formulate unique testId: e.g. ORD-001, FUL-002, BRG-001, ADM-001
      const prefixMap: Record<string, string> = {
        ordering: 'ORD',
        fulfillment: 'FUL',
        admin: 'ADM',
        'e2e-bridge': 'BRG',
        generated: 'GEN',
        setup: 'STP',
      };
      const prefix = prefixMap[project] || 'TST';
      const testId = `${prefix}-${String(count).padStart(3, '0')}`;

      const moduleName = deriveModule(relPath, tags);
      const suite = deriveSuite(tags, project, rawTitle);
      const priority = derivePriority(suite, tags, rawTitle);

      // Duration estimation
      let duration = 15000;
      if (suite === 'e2e') duration = 90000;
      else if (suite === 'release-critical') duration = 45000;
      else if (suite === 'smoke') duration = 10000;

      manifestTests.push({
        id: testId,
        title: cleanTitle,
        file: relPath,
        project,
        module: moduleName,
        suite,
        priority,
        tags,
        dependencies: projectDeps[project] || ['setup-preflight'],
        estimatedDurationMs: duration,
      });
    }
  }

  scanDirectory(testsDir);

  // Compute summary metrics
  const suitesCount: Record<string, number> = {};
  const projectsCount: Record<string, number> = {};
  const prioritiesCount: Record<string, number> = {};

  for (const t of manifestTests) {
    suitesCount[t.suite] = (suitesCount[t.suite] || 0) + 1;
    projectsCount[t.project] = (projectsCount[t.project] || 0) + 1;
    prioritiesCount[t.priority] = (prioritiesCount[t.priority] || 0) + 1;
  }

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    summary: {
      totalTests: manifestTests.length,
      suites: suitesCount,
      projects: projectsCount,
      priorities: prioritiesCount,
    },
    tests: manifestTests,
  };
}

// CLI Execution
if (require.main === module) {
  const outputPath = path.resolve(process.cwd(), 'test-manifest.json');
  console.log('\n==================================================');
  console.log('📑 TEST MANIFEST GENERATOR — Automated QA Catalog');
  console.log('==================================================');

  const manifest = generateManifest('./tests');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`✅ Successfully generated test manifest with ${manifest.summary.totalTests} test cases!`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('--------------------------------------------------');
  console.log('📊 Suites Summary:');
  Object.entries(manifest.summary.suites).forEach(([suite, count]) => {
    console.log(`   - ${suite.padEnd(18)}: ${count}`);
  });
  console.log('📦 Projects Summary:');
  Object.entries(manifest.summary.projects).forEach(([project, count]) => {
    console.log(`   - ${project.padEnd(18)}: ${count}`);
  });
  console.log('==================================================\n');
}

