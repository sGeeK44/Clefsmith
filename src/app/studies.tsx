import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/**
 * The parcours, stacked over the tabs.
 *
 * It is empty: CLE-37 fills it. It exists here so that "touching a mode leads to
 * the parcours" is something that can be checked rather than promised.
 */
export default function StudiesScreen() {
  return (
    <Screen>
      <Text variant="display">Parcours</Text>
    </Screen>
  );
}
