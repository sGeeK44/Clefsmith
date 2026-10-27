type Platform = 'ios' | 'android';

const PLATFORM = (process.env.E2E_PLATFORM ?? 'ios') as Platform;

/**
 * The suite runs against a binary you built; it is pointed at one rather than
 * hard-coding a build output path.
 *
 * The iOS simulator is named by its udid, the same identifier the build was
 * pointed at. A device name is ambiguous — the same model exists under every
 * installed runtime — and leaves the driver to infer a version from the SDK the
 * app was compiled against, which is not necessarily one that is installed.
 */
const REQUIRED: Record<Platform, string[]> = {
  android: ['E2E_ANDROID_APP', 'E2E_ANDROID_AVD'],
  ios: ['E2E_IOS_APP', 'E2E_IOS_UDID'],
};

function fromEnv(name: string): string {
  return process.env[name] ?? '';
}

/**
 * Only the selected platform is built: reading both would demand the Android
 * variables to run on iOS.
 *
 * Both drivers skip the install when the same package and version is already on
 * the device, which silently runs the suite against the previous build. The app
 * is reinstalled on every session so that what is asserted is what was just
 * built.
 */
function capabilitiesFor(platform: Platform): WebdriverIO.Capabilities {
  if (platform === 'android') {
    return {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app': fromEnv('E2E_ANDROID_APP'),
      'appium:avd': fromEnv('E2E_ANDROID_AVD'),
      'appium:enforceAppInstall': true,
      'appium:newCommandTimeout': 240,
    };
  }

  return {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:app': fromEnv('E2E_IOS_APP'),
    'appium:udid': fromEnv('E2E_IOS_UDID'),
    'appium:forceAppInstall': true,
    'appium:newCommandTimeout': 240,
    /**
     * The first session on a machine compiles and installs WebDriverAgent
     * before the app is even launched, which takes minutes on a fresh CI
     * runner. The defaults are sized for a developer machine, where that
     * work was done once, months ago.
     */
    'appium:wdaLaunchTimeout': 360_000,
    'appium:wdaConnectionTimeout': 360_000,
  };
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',

  specs: ['./features/**/*.feature'],
  maxInstances: 1,
  capabilities: [capabilitiesFor(PLATFORM)],

  /**
   * Appium reads the project's driver manifest on startup, which on a cold CI
   * machine takes longer than the thirty seconds the service allows by
   * default — and the service only logs the timeout, leaving every session to
   * fail against a port nothing listens on yet.
   */
  services: [['appium', { appiumStartTimeout: 180_000 }]],
  port: 4723,

  framework: 'cucumber',
  reporters: ['spec'],
  cucumberOpts: {
    require: ['./step-definitions/**/*.ts'],
    timeout: 120_000,
  },

  logLevel: 'warn',
  waitforTimeout: 30_000,
  connectionRetryTimeout: 420_000,
  connectionRetryCount: 2,

  /**
   * Checked when the suite starts, not when this file is imported: a config
   * that throws on load cannot be read by the tools that analyse the project.
   *
   * The run is ended rather than the hook left to throw — WebdriverIO logs a
   * hook error and carries on, which turns a missing variable into a thirty
   * second timeout on an element that was never going to be there.
   */
  onPrepare() {
    const missing = REQUIRED[PLATFORM].filter((name) => fromEnv(name) === '');

    if (missing.length === 0) {
      return;
    }

    console.error(
      `${missing.join(', ')} not set. The suite runs against a binary you built; point it at one rather than hard-coding a build output path.`,
    );
    process.exit(1);
  },
};
