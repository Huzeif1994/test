import { Page, Locator } from '@playwright/test';

/**
 * Sabhi pages ki parent class.
 * Common kaam (navigate, wait, title) yahan, page-specific locators child class mein.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Page ka path (baseURL ke baad). Child class override karegi. */
  protected abstract readonly path: string;

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  url(): string {
    return this.page.url();
  }

  /** Text ke basis par locator (chhote helper) */
  protected byText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
