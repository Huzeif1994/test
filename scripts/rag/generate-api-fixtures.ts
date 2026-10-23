import { generateApiClient } from '../api/generate-api-fixtures';
import path from 'path';

export { generateApiClient };

if (require.main === module) {
  const schemaFile = path.resolve(process.cwd(), 'schemas/ftx-commerce-openapi.sample.json');
  const targetOutput = path.resolve(process.cwd(), 'api/FTXApiClient.ts');
  generateApiClient(schemaFile, targetOutput);
}
