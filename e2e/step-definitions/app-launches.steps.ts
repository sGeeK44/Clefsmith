import { Then, When } from '@wdio/cucumber-framework';
import { expect } from '@wdio/globals';

import { settingsScreen } from '../screenobjects/settings.screen.js';
import { tabBar } from '../screenobjects/tab-bar.js';

When('the app is launched', async () => {
  await tabBar.waitUntilDisplayed();
});

When('the settings tab is opened', async () => {
  await tabBar.open('settings');
});

Then('the settings screen shows the application version', async () => {
  expect(await settingsScreen.readVersionLine()).toMatch(/^Clefsmith \d+\.\d+\.\d+$/);
});
