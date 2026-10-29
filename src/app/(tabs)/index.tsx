import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/** The desk a session is started from. CLE-36 puts something on it. */
export default function DeskScreen() {
  return (
    <Screen>
      <Text variant="display">Mon pupitre</Text>
    </Screen>
  );
}
