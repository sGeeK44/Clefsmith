import { AppScreen } from './app-screen.js';

const APP_VERSION = 'app-version';

class SettingsScreen extends AppScreen {
  async readVersionLine(): Promise<string> {
    await this.testId(APP_VERSION).waitForDisplayed();

    return this.testId(APP_VERSION).getText();
  }
}

export const settingsScreen = new SettingsScreen();
