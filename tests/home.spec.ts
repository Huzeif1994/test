import { test } from '../fixtures/pages';

test.describe('Home page', () => {
  test('home page opens', async ({ homePage }) => {
    await homePage.goto();
    await homePage.expectOnHomePage();
  });
});