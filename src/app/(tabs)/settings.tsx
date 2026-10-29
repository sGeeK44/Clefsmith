import { useService } from '@/components/container-provider';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { SYMBOLS } from '@/infrastructure/symbols';

/**
 * The settings, and the version.
 *
 * The version used to sit on the design-system gallery because that was the only
 * route there was. Settings is where a user actually looks for it, and the e2e
 * suite follows it here.
 */
export default function SettingsScreen() {
  const getAppVersion = useService(SYMBOLS.usecases.GetAppVersion);

  return (
    <Screen>
      <Text variant="display">Réglages</Text>
      <Text testID="app-version" variant="caption" tone="muted">
        {getAppVersion()}
      </Text>
    </Screen>
  );
}
