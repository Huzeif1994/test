import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment';

export class OrderingHomePage extends BasePage {
  protected readonly path = '/';

  async expectOnHomePage(): Promise<void> {
    const hostname = new URL(config.ordering.baseUrl).hostname.replace(/\./g, '\\.');
    await expect(this.page).toHaveURL(new RegExp(hostname));
  }
}

