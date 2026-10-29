import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Card } from '@/components/ui/card';
import { Flash } from '@/components/ui/flash';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { STUDIES, studyLine, tempoOf } from '@/components/wording/study';
import type { Notation } from '@/domain/notation/naming';
import type { Pitch } from '@/domain/notation/pitch';
import { type Level, newcomersOf } from '@/domain/training/level';
import { SYMBOLS } from '@/infrastructure/symbols';

const PARCOURS = '/studies';

/** In the mockup's order. The last two have nothing behind them yet. */
const MODES = [
  { id: 'reading', label: 'Lecture de notes', open: true },
  { id: 'rhythmic-reading', label: 'Lecture rythmée', open: true },
  { id: 'rhythm', label: 'Rythme seul', open: false },
  { id: 'dictation', label: 'Dictée musicale', open: false },
] as const;

/**
 * The desk: where the learner is, and what they can do about it.
 *
 * Only the treble clef is on it. The bass clef has a progression of its own, and
 * no screen of CLE-14 shows it — a desk showing both would ask the learner to
 * pick a clef before they have read a note.
 *
 * Nothing that depends on the record is drawn before the record is read. A level
 * guessed while loading would show the learner someone else's study for a frame.
 */
export default function DeskScreen() {
  const getProgress = useService(SYMBOLS.usecases.GetProgress);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [level, setLevel] = useState<Level>();
  const [notation, setNotation] = useState<Notation>();
  const [coming, setComing] = useState<string>();

  /** Re-read on focus: the progression can be reset from the next tab along. */
  useFocusEffect(
    useCallback(() => {
      getProgress().then((progress) => setLevel(progress.level.treble));
    }, [getProgress]),
  );

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  const forget = useCallback(() => setComing(undefined), []);

  return (
    <Screen>
      <Text variant="display">Mon pupitre</Text>

      {level !== undefined && notation !== undefined && (
        <Current level={level} notation={notation} />
      )}

      <View style={styles.modes}>
        {MODES.map((mode) => (
          <Mode key={mode.id} level={level} mode={mode} onClosed={setComing} />
        ))}
      </View>

      <Flash message={coming} onGone={forget} />
    </Screen>
  );
}

/**
 * What the learner is on, and the way into it.
 *
 * The whole card is the affordance rather than a button inside it: that is what
 * the mockup draws, and a button nested in a tappable card is two targets where
 * the learner sees one.
 */
function Current({ level, notation }: { readonly level: Level; readonly notation: Notation }) {
  const brought = newcomersOf('treble', level);

  return (
    <Pressable onPress={() => router.push(PARCOURS)} testID="current-study">
      <Card>
        <View style={styles.row}>
          <Text variant="caption" tone="muted">
            En cours
          </Text>
          <Text variant="caption" tone="muted">
            Clé de sol
          </Text>
        </View>

        {brought.length > 0 && (
          <Staff clef="treble" notes={brought.map((pitch) => ({ pitch, current: false }))} />
        )}

        <Text variant="title">{tempoOf(level)}</Text>
        <Text testID="current-study-line" variant="caption" tone="muted">
          {studyLine(level, notation)}
        </Text>
      </Card>
    </Pressable>
  );
}

function Mode({
  level,
  mode,
  onClosed,
}: {
  readonly level: Level | undefined;
  readonly mode: (typeof MODES)[number];
  readonly onClosed: (message: string) => void;
}) {
  const { id, label, open } = mode;

  return (
    <Pressable
      onPress={() => (open ? router.push(PARCOURS) : onClosed(`${label} arrive bientôt`))}
      style={styles.mode}
      testID={`mode-${id}`}
    >
      <Text>{label}</Text>
      <Text variant="caption" tone={open ? 'accent' : 'muted'}>
        {badge(open, level)}
      </Text>
    </Pressable>
  );
}

/** An open mode says how far up the six the learner is, once that is known. */
function badge(open: boolean, level: Level | undefined): string {
  if (!open) {
    return 'Bientôt';
  }

  return level === undefined ? '' : `${level} / ${STUDIES}`;
}

const styles = StyleSheet.create((theme) => ({
  modes: { gap: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  mode: {
    alignItems: 'center',
    backgroundColor: theme.colors.surf,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
}));
