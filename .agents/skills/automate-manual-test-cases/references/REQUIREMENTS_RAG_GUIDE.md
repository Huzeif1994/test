# 🧬 SDET Requirements RAG & GenAI Quality Engineering Guide

This guide details two advanced capabilities in our framework:
1. **Requirements RAG:** Grounding Playwright test generation in live OpenAPI/Swagger schemas and Jira tickets.
2. **GenAI & RAG Application Testing:** How to validate and assert against AI/LLM-powered features in the web application.

---

## 1. Requirements RAG: OpenAPI-to-Fixture Pipeline

Instead of writing HTTP requests or UI seeding manually, this framework uses deterministic schema ingestion:

```bash
# 1. Place the latest OpenAPI/Swagger JSON in schemas/
# 2. Run the generator:
npm run rag:generate-fixtures
```

### What it produces:
* `api/FTXApiClient.ts`: Strongly typed API client methods using Playwright's `APIRequestContext`.
* Fast-seeds carts, creates orders, or fetches gift card status in under **200ms** (compared to 30s through UI).

### Usage in Playwright Tests:
```typescript
import { test, expect } from '@playwright/test';
import { FTXApiClient } from '../../api/FTXApiClient';

test('Fast API order seeding for fulfillment test', async ({ request }) => {
  const apiClient = new FTXApiClient(request);
  
  // Seed item via API
  await apiClient.addToCart({ sku: 'PHYSICAL-GC-25', quantity: 1, amount: 25.0 });
  const order = await apiClient.checkoutOrder({ paymentMethod: 'CREDIT_CARD' });
  
  console.log(`Order created: ${order.orderId}`);
  // Now test only Fulfillment UI picking, skipping redundant Storefront checkout!
});
```

---

## 2. Testing GenAI & RAG Features (SDET Evaluation Framework)

When testing conversational AI, chatbots, or search assistance on the storefront:

### Core Evaluation Dimensions:
| Metric | What it Asserts | Playwright / LLM-Judge Assertion |
| :--- | :--- | :--- |
| **Context Recall** | Did the bot find the correct catalog item? | Compare retrieved SKU list against catalog DB. |
| **Faithfulness** | Did the bot hallucinate non-existent gift cards or discounts? | Assert response facts are 100% grounded in retrieved context. |
| **Answer Relevancy** | Did the bot directly answer the user's intent? | Assert response intent matches expected user goal. |

### Evaluation Pattern (LLM-as-a-Judge):
```typescript
// Example test in tests/ai-eval/
test('Chatbot gift card inquiry faithfulness', async ({ page }) => {
  await page.goto('/support-chat');
  await page.fill('#chat-input', 'Can I buy a physical gift card for $25?');
  await page.click('#chat-send');
  
  const botAnswer = await page.locator('.bot-message').last().textContent();
  
  // Deterministic guard
  expect(botAnswer).toContain('$25');
  expect(botAnswer).not.toContain('Free Gift Card'); // Hallucination guard
});
```

