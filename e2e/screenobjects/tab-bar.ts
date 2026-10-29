import { AppScreen } from './app-screen.js';

type Tab = 'desk' | 'progress' | 'settings';

/**
 * The three tabs, addressed by the testID their layout puts on each button.
 *
 * Waiting on the bar rather than on a screen is what makes "the app is launched"
 * independent of whatever the tabs happen to show.
 */
class TabBar extends AppScreen {
  async waitUntilDisplayed(): Promise<void> {
    await this.testId('tab-desk').waitForDisplayed();
  }

  async open(tab: Tab): Promise<void> {
    await this.testId(`tab-${tab}`).click();
  }
}

export const tabBar = new TabBar();
