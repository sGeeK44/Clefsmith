import type { ChainablePromiseElement } from 'webdriverio';

/**
 * The single place in the suite that knows which platform it runs on.
 *
 * `testID` on a React Native element becomes the accessibility identifier on
 * iOS and the resource id on Android. Every other file addresses elements by
 * that one name and stays platform-agnostic.
 */
export abstract class AppScreen {
  protected testId(name: string): ChainablePromiseElement {
    return browser.isIOS ? $(`~${name}`) : $(`android=new UiSelector().resourceId("${name}")`);
  }
}
