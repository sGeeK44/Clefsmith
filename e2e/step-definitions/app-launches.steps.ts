import { Then, When } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';

import { rootScreen } from '../screenobjects/root.screen.js';

When('the app is launched', async () => {
  await rootScreen.waitUntilDisplayed();
});

Then('the root screen shows the application version', async () => {
  expect(await rootScreen.readVersionLine()).toMatch(/^Clefsmith \d+\.\d+\.\d+$/);
});
