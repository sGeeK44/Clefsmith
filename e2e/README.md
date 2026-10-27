# End-to-end suite

Gherkin features run against a real build through Appium, so a scenario written
during the research phase becomes the executable test without being rewritten.

- `features/` — the scenarios, in the same wording the ticket carries.
- `step-definitions/` — the steps. No raw selector, no fixed pause; `bun run e2e:check` enforces both.
- `screenobjects/` — how a screen is addressed. `AppScreen` is the only file that knows the platform.

An element is addressed by the `testID` the component declares: it becomes the
accessibility identifier on iOS and the resource id on Android.

## Running it

The suite runs against a binary you built; it never builds one itself, and it
never guesses where one is.

### iOS

```sh
bunx expo run:ios --device <udid> --configuration Release   # xcrun simctl list devices
E2E_PLATFORM=ios \
E2E_IOS_APP=<path to Clefsmith.app> \
E2E_IOS_UDID=<udid> \
bun run e2e
```

The simulator is named by its udid, not by its model: the same model exists
under every installed runtime, and the driver would otherwise infer a version
from the SDK the app was compiled against — which is not necessarily installed.

### Android

```sh
bunx expo run:android --variant release
E2E_PLATFORM=android \
E2E_ANDROID_APP=<path to app-release.apk> \
E2E_ANDROID_AVD=<avd name> \
bun run e2e
```

Both platforms run the same features. Nothing is excluded on either one.
