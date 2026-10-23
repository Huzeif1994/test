import { test, expect } from '@playwright/test';
import { generateApiClient, validateOpenApiSpec } from '../../scripts/api/generate-api-fixtures';
import path from 'path';
import fs from 'fs';

test.describe('OpenAPI Fixture Generator — Unit Test Suite', () => {
  const sampleSchema = path.resolve(process.cwd(), 'schemas/ftx-commerce-openapi.sample.json');
  const tempOutput = path.resolve(process.cwd(), 'temp/test-client.ts');

  test.afterAll(() => {
    if (fs.existsSync(tempOutput)) {
      fs.unlinkSync(tempOutput);
    }
    const tempDir = path.dirname(tempOutput);
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmdirSync(tempDir);
      } catch {
        // ignore
      }
    }
  });

  test('should validate OpenAPI spec structure correctly', () => {
    expect(() => validateOpenApiSpec(null)).toThrow(/Invalid specification/);
    expect(() => validateOpenApiSpec({ foo: 'bar' })).toThrow(/Unsupported specification version/);
    expect(() => validateOpenApiSpec({ openapi: '3.0.0' })).toThrow(/missing "paths"/);
    expect(() => validateOpenApiSpec({ openapi: '3.0.0', paths: {} })).not.toThrow();
  });

  test('should parse schema and generate typed interfaces and methods', () => {
    const summary = generateApiClient(sampleSchema, tempOutput);

    expect(summary.apiTitle).toBe('FTX Commerce API');
    expect(summary.apiVersion).toBe('1.0.0');
    expect(summary.methodsCount).toBe(4);
    expect(summary.interfacesCount).toBeGreaterThanOrEqual(3);

    expect(fs.existsSync(tempOutput)).toBeTruthy();
    const content = fs.readFileSync(tempOutput, 'utf-8');

    // Interfaces validation
    expect(content).toContain('export interface AddToCartPayload');
    expect(content).toContain('export interface CheckoutOrderPayload');
    expect(content).toContain('export interface FulfillHandoverPayload');

    // Methods validation
    expect(content).toContain('async addToCart(');
    expect(content).toContain('async checkoutOrder(');
    expect(content).toContain('async getGiftCardStatus(');
    expect(content).toContain('async fulfillHandover(');
  });
});
