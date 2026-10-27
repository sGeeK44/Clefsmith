type Platform = 'ios' | 'android';

const PLATFORM = (process.env.E2E_PLATFORM ?? 'ios') as Platform;

function required(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(
      `${name} is not set. The suite runs against a binary you built; point ${name} at it rather than hard-coding a build output path.`,
    );
  }

  return value;
}

/**
 * Only the selected platform is built: reading both would demand the Android
 * variables to run on iOS.
 *
 * The iOS simulator is named by its udid, the same identifier the build was
 * pointed at. A device name is ambiguous — the same model exists under every
 * installed runtime — and leaves the driver to infer a version from the SDK the
 * app was compiled against, which is not necessarily one that is installed.
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
      'appium:app': required('E2E_ANDROID_APP'),
      'appium:avd': required('E2E_ANDROID_AVD'),
      'appium:enforceAppInstall': true,
      'appium:newCommandTimeout': 240,
    };
  }

  return {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:app': required('E2E_IOS_APP'),
    'appium:udid': required('E2E_IOS_UDID'),
    'appium:forceAppInstall': true,
    'appium:newCommandTimeout': 240,
  };
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',

  specs: ['./features/**/*.feature'],
  maxInstances: 1,
  capabilities: [capabilitiesFor(PLATFORM)],

  services: ['appium'],
  port: 4723,

  framework: 'cucumber',
  reporters: ['spec'],
  cucumberOpts: {
    require: ['./step-definitions/**/*.ts'],
    timeout: 120_000,
  },

  logLevel: 'warn',
  waitforTimeout: 30_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 2,
};
