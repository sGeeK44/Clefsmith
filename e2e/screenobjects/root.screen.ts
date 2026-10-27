import { AppScreen } from './app-screen.js';

const APP_VERSION = 'app-version';

class RootScreen extends AppScreen {
  async waitUntilDisplayed(): Promise<void> {
    await this.testId(APP_VERSION).waitForDisplayed();
  }

  async readVersionLine(): Promise<string> {
    return this.testId(APP_VERSION).getText();
  }
}

export const rootScreen = new RootScreen();
