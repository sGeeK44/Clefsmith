import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/**
 * The exercise, stacked over the parcours.
 *
 * It is empty: CLE-12 fills it. It reads the parameters the parcours hands it so
 * that what the learner set up is visibly carried across, and so the next unit
 * has the contract in front of it rather than in a ticket.
 */
export default function ExerciseScreen() {
  const { clef, level, tempo, measures, metronome } = useLocalSearchParams();

  return (
    <Screen>
      <Text variant="display">Exercice</Text>
      <Text variant="caption" tone="muted">
        {`${clef} · ${level} · ${tempo} bpm · ${measures} mesures · métronome ${metronome}`}
      </Text>
    </Screen>
  );
}
