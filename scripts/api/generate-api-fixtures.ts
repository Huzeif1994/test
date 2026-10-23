import fs from 'fs';
import path from 'path';

export interface GenerationSummary {
  apiTitle: string;
  apiVersion: string;
  methodsCount: number;
  interfacesCount: number;
  outputPath: string;
}

/**
 * Maps OpenAPI schema property types to TypeScript types
 */
function mapPropertyType(prop: any): string {
  if (!prop) return 'any';
  if (prop.enum && Array.isArray(prop.enum)) {
    return prop.enum.map((v: string) => `'${v}'`).join(' | ');
  }
  switch (prop.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return prop.items ? `${mapPropertyType(prop.items)}[]` : 'any[]';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * Validates OpenAPI specification structure
 */
export function validateOpenApiSpec(spec: any): void {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid specification: content is not a valid JSON object.');
  }
  const isV3 = typeof spec.openapi === 'string' && spec.openapi.startsWith('3.');
  const isV2 = typeof spec.swagger === 'string' && spec.swagger.startsWith('2.');
  if (!isV3 && !isV2) {
    throw new Error('Unsupported specification version. Must be OpenAPI 3.x or Swagger 2.0.');
  }
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('Invalid specification: missing "paths" definition object.');
  }
}

/**
 * OpenAPI-driven API Client & Fixture Generator
 * Synthesizes typed Playwright API clients and request/response interfaces from schema specs.
 */
export function generateApiClient(schemaPath: string, outputPath: string): GenerationSummary {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }

  const raw = fs.readFileSync(schemaPath, 'utf-8');
  let spec: any;
  try {
    spec = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`Failed to parse OpenAPI JSON: ${err.message}`);
  }

  // Validate OpenAPI schema
  validateOpenApiSpec(spec);

  const apiTitle = spec.info?.title || 'FTX Commerce API';
  const apiVersion = spec.info?.version || '1.0.0';
  const baseUrl = spec.servers?.[0]?.url || 'https://ftx.dev.ftxcommerce.com/api/v1';

  const interfaceLines: string[] = [];
  const methodLines: string[] = [];
  let methodsCount = 0;
  let interfacesCount = 0;

  const paths = spec.paths || {};

  for (const [route, methods] of Object.entries<any>(paths)) {
    for (const [method, details] of Object.entries<any>(methods)) {
      const httpMethod = method.toLowerCase();
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(httpMethod)) continue;

      methodsCount++;
      const opId = details.operationId || `${httpMethod}_${route.replace(/[\/{}-]/g, '_')}`;
      const summary = details.summary || `${method.toUpperCase()} ${route}`;

      // Extract Path Parameters
      const pathParams: Array<{ name: string; type: string }> = [];
      if (details.parameters) {
        for (const p of details.parameters) {
          if (p.in === 'path') {
            pathParams.push({
              name: p.name,
              type: mapPropertyType(p.schema),
            });
          }
        }
      }

      // Check for inline path param in route if not in parameters list
      const matches = route.match(/\{([^}]+)\}/g);
      if (matches) {
        for (const m of matches) {
          const pName = m.replace(/[{}]/g, '');
          if (!pathParams.some(p => p.name === pName)) {
            pathParams.push({ name: pName, type: 'string' });
          }
        }
      }

      // Extract Request Body Schema & Generate Typed Interface
      let payloadTypeName = '';
      const requestBodySchema = details.requestBody?.content?.['application/json']?.schema;
      if (requestBodySchema && requestBodySchema.properties) {
        interfacesCount++;
        const pascalOp = opId.charAt(0).toUpperCase() + opId.slice(1);
        payloadTypeName = `${pascalOp}Payload`;
        const requiredProps: string[] = requestBodySchema.required || [];

        interfaceLines.push(`export interface ${payloadTypeName} {`);
        for (const [pName, pSchema] of Object.entries<any>(requestBodySchema.properties)) {
          const isRequired = requiredProps.includes(pName);
          const pType = mapPropertyType(pSchema);
          interfaceLines.push(`  ${pName}${isRequired ? '' : '?'}: ${pType};`);
        }
        interfaceLines.push(`}`);
        interfaceLines.push(``);
      }

      // Build method signature
      const signatureParts: string[] = [];
      for (const p of pathParams) {
        signatureParts.push(`${p.name}: ${p.type}`);
      }
      if (payloadTypeName) {
        signatureParts.push(`payload: ${payloadTypeName}`);
      } else if (['post', 'put', 'patch'].includes(httpMethod) && details.requestBody) {
        signatureParts.push(`payload: any`);
      }

      let urlExpr = `\`\${this.baseUrl}${route}\``;
      for (const p of pathParams) {
        urlExpr = urlExpr.replace(`{${p.name}}`, `\${${p.name}}`);
      }

      methodLines.push(`  /**`);
      methodLines.push(`   * ${summary}`);
      methodLines.push(`   * ${method.toUpperCase()} ${route}`);
      methodLines.push(`   */`);
      methodLines.push(`  async ${opId}(${signatureParts.join(', ')}): Promise<any> {`);
      if (['post', 'put', 'patch'].includes(httpMethod)) {
        methodLines.push(`    const response = await this.request.${httpMethod}(${urlExpr}, { data: payload });`);
      } else {
        methodLines.push(`    const response = await this.request.${httpMethod}(${urlExpr});`);
      }
      methodLines.push(`    expect(response.ok(), \`API call ${opId} failed with status \${response.status()}\`).toBeTruthy();`);
      methodLines.push(`    return await response.json().catch(() => ({}));`);
      methodLines.push(`  }`);
      methodLines.push(``);
    }
  }

  const outputContent = [
    `// 🤖 AUTOGENERATED VIA SDET OPENAPI FIXTURE GENERATOR`,
    `// API: ${apiTitle} (v${apiVersion})`,
    `// Source Specification: ${path.basename(schemaPath)}`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `import { APIRequestContext, expect } from '@playwright/test';`,
    ``,
    `// ==========================================`,
    `// Typed Request & Response Interfaces`,
    `// ==========================================`,
    ...interfaceLines,
    `// ==========================================`,
    `// Strongly Typed API Client Fixture`,
    `// ==========================================`,
    `export class FTXApiClient {`,
    `  constructor(private request: APIRequestContext, private baseUrl: string = '${baseUrl}') {}`,
    ``,
    ...methodLines,
    `}`,
    ``,
  ].join('\n');

  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, outputContent, 'utf-8');

  return {
    apiTitle,
    apiVersion,
    methodsCount,
    interfacesCount,
    outputPath,
  };
}

if (require.main === module) {
  const schemaFile = path.resolve(process.cwd(), 'schemas/ftx-commerce-openapi.sample.json');
  const targetOutput = path.resolve(process.cwd(), 'api/FTXApiClient.ts');

  console.log('\n==================================================');
  console.log('🧬 SDET OPENAPI FIXTURE GENERATOR');
  console.log('==================================================');
  console.log(`📖 Ingesting OpenAPI Specification: ${schemaFile}`);
  const summary = generateApiClient(schemaFile, targetOutput);
  console.log(`✅ Generated ${summary.methodsCount} typed API methods`);
  console.log(`✅ Generated ${summary.interfacesCount} TypeScript payload interfaces`);
  console.log(`📄 Saved to: ${summary.outputPath}`);
  console.log('==================================================\n');
}
