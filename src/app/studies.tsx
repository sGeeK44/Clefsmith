import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Choice, type Option } from '@/components/ui/choice';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { measuresLine, tempoLine } from '@/components/wording/session';
import { broughtLine, clefName, studyLine, tempoOf } from '@/components/wording/study';
import { CLEFS, type Clef } from '@/domain/notation/clef';
import type { Notation } from '@/domain/notation/naming';
import { LEVELS, type Level, poolOf } from '@/domain/training/level';
import { type Progress, type Reach, reachOf } from '@/domain/training/progress';
import { defaultSessionSettings } from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

const PICK_CLEF: readonly Option<Clef>[] = CLEFS.map((clef) => ({
  value: clef,
  label: clefName(clef),
}));

/**
 * The parcours: the six studies of one clef, and what the chosen one holds.
 *
 * A study ahead of the learner does not answer — it is drawn so that they can
 * see where they are going, not so that they can skip there.
 */
export default function StudiesScreen() {
  const getProgress = useService(SYMBOLS.usecases.GetProgress);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [progress, setProgress] = useState<Progress>();
  const [notation, setNotation] = useState<Notation>();
  const [clef, setClef] = useState<Clef>('treble');
  const [chosen, setChosen] = useState<Level>();

  useEffect(() => {
    getProgress().then((read) => {
      setProgress(read);
      setChosen(read.level.treble);
    });
  }, [getProgress]);

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  /** Changing clef moves the learner to where they are in that clef, not where they were. */
  const pickClef = useCallback(
    (picked: Clef) => {
      setClef(picked);
      setChosen(progress?.level[picked]);
    },
    [progress],
  );

  const read = progress !== undefined && notation !== undefined && chosen !== undefined;

  return (
    <Screen>
      <Text variant="display">Parcours</Text>

      {read && (
        <>
          <Choice options={PICK_CLEF} chosen={clef} onChoose={pickClef} />

          <ScrollView contentContainerStyle={styles.ladder}>
            {LEVELS.map((level) => (
              <Study
                key={level}
                chosen={level === chosen}
                clef={clef}
                level={level}
                notation={notation}
                onChoose={setChosen}
                reach={reachOf(progress, clef, level)}
              />
            ))}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

function Study({
  chosen,
  clef,
  level,
  notation,
  onChoose,
  reach,
}: {
  readonly chosen: boolean;
  readonly clef: Clef;
  readonly level: Level;
  readonly notation: Notation;
  readonly onChoose: (level: Level) => void;
  readonly reach: Reach;
}) {
  const ahead = reach === 'ahead';

  return (
    <View style={styles.study}>
      <Pressable
        disabled={ahead}
        onPress={() => onChoose(level)}
        style={styles.head}
        testID={`study-${level}`}
      >
        <Text style={ahead ? styles.ahead : styles.reached}>{level}</Text>
        <Text variant="title">{tempoOf(level)}</Text>
        {reach === 'done' && (
          <Text variant="caption" tone="ok">
            Terminé
          </Text>
        )}
      </Pressable>

      {chosen && !ahead && <Open clef={clef} level={level} notation={notation} />}
    </View>
  );
}

/** What the chosen study holds, and the way into it. */
function Open({
  clef,
  level,
  notation,
}: {
  readonly clef: Clef;
  readonly level: Level;
  readonly notation: Notation;
}) {
  const { tempo, measures, metronome } = defaultSessionSettings();

  return (
    <Card>
      <Text variant="caption" tone="muted">
        {studyLine(level, notation)}
      </Text>

      {/* The last studies draw fifteen notes, which is wider than any phone. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Staff
          clef={clef}
          notes={poolOf(clef, level).map((pitch) => ({ pitch, current: false }))}
          space={8}
        />
      </ScrollView>

      <View style={styles.marks}>
        <Text variant="caption" tone="muted">
          {measuresLine(measures)}
        </Text>
        <Text variant="caption" tone="muted">
          {tempoLine(tempo)}
        </Text>
        <Text variant="caption" tone="muted">
          {broughtLine(clef, level)}
        </Text>
      </View>

      <Button
        label="Commencer"
        onPress={() =>
          router.push({
            pathname: '/exercise',
            params: { clef, level, tempo, measures, metronome: String(metronome) },
          })
        }
        testID="start"
      />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  ladder: { gap: theme.spacing.s, paddingBottom: theme.spacing.l },
  study: { gap: theme.spacing.xs },
  head: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  marks: { flexDirection: 'row', gap: theme.spacing.m },
  reached: { color: theme.colors.accent },
  ahead: { color: theme.colors.muted },
}));
