import { test, expect } from '@playwright/test';
import {
  generateApiClient,
  validateOpenApiSpec,
  resolveRefName,
  mapPropertyType,
} from '../../scripts/api/generate-api-fixtures';
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

  test('should resolve $ref pointer to schema name', () => {
    expect(resolveRefName('#/components/schemas/CustomerOrder')).toBe('CustomerOrder');
    expect(resolveRefName('#/definitions/InventoryItem')).toBe('InventoryItem');
  });

  test('should correctly map allOf, oneOf, and enum types', () => {
    // Enum
    expect(mapPropertyType({ type: 'string', enum: ['Standard', 'Express'] })).toBe("'Standard' | 'Express'");

    // allOf intersection
    expect(
      mapPropertyType({
        allOf: [{ type: 'string' }, { $ref: '#/components/schemas/AuditMetadata' }],
      })
    ).toBe('string & AuditMetadata');

    // oneOf union
    expect(
      mapPropertyType({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      })
    ).toBe('string | number');
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
    expect(summary.interfacesCount).toBeGreaterThanOrEqual(5);

    expect(fs.existsSync(tempOutput)).toBeTruthy();
    const content = fs.readFileSync(tempOutput, 'utf-8');

    // Request payload interfaces
    expect(content).toContain('export interface AddToCartPayload');
    expect(content).toContain('export interface CheckoutOrderPayload');
    expect(content).toContain('export interface FulfillHandoverPayload');

    // Response payload interfaces
    expect(content).toContain('export interface CheckoutOrderResponse');
    expect(content).toContain('export interface GetGiftCardStatusResponse');

    // Strongly typed method signatures
    expect(content).toContain('async checkoutOrder(payload: CheckoutOrderPayload): Promise<CheckoutOrderResponse>');
    expect(content).toContain('async getGiftCardStatus(id: string): Promise<GetGiftCardStatusResponse>');
  });
});
