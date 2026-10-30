import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Card } from '@/components/ui/card';
import { Flash } from '@/components/ui/flash';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { badgeLine, progressOf } from '@/components/wording/desk';
import { MODES, type Mode } from '@/components/wording/mode';
import { studyLine, tempoOf } from '@/components/wording/study';
import type { Notation } from '@/domain/notation/naming';
import { type Level, newcomersOf } from '@/domain/training/level';
import { SYMBOLS } from '@/infrastructure/symbols';

const PARCOURS = '/studies';

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

      <Text variant="overline" tone="muted">
        Exercices
      </Text>
      <View style={styles.modes}>
        {MODES.map((mode) => (
          <Exercise key={mode.id} level={level} mode={mode} onClosed={setComing} />
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
 * the learner sees one. The disc is drawn for the eye, not for the finger —
 * it is what makes the card read as a way in rather than as a summary.
 */
function Current({ level, notation }: { readonly level: Level; readonly notation: Notation }) {
  const brought = newcomersOf('treble', level);

  return (
    <Pressable onPress={() => router.push(PARCOURS)} testID="current-study">
      <Card>
        <View style={styles.row}>
          <Text variant="overline" tone="accent">
            En cours
          </Text>
          <Text variant="caption" tone="muted">
            Clé de sol
          </Text>
        </View>

        {brought.length > 0 && (
          <Staff
            clef="treble"
            notes={brought.map((pitch) => ({ pitch, shade: 'ahead' }) as const)}
          />
        )}

        <View style={styles.row}>
          <View>
            <Text variant="title">{tempoOf(level)}</Text>
            <Text testID="current-study-line" variant="caption" tone="muted">
              {studyLine(level, notation)}
            </Text>
          </View>
          <View style={styles.disc}>
            <Text style={styles.play}>▶</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * One exercise, as a line rather than as a card.
 *
 * Four cards of equal weight say the four are equally available, which two of
 * them are not. A line carries its own progress, and the bar is what tells the
 * open ones apart from the ones with nothing behind them.
 */
function Exercise({
  level,
  mode,
  onClosed,
}: {
  readonly level: Level | undefined;
  readonly mode: Mode;
  readonly onClosed: (message: string) => void;
}) {
  const { id, label, glyph, open } = mode;

  return (
    <Pressable
      onPress={() =>
        open
          ? router.push({ pathname: PARCOURS, params: { mode: id } })
          : onClosed(`${label} arrive bientôt`)
      }
      style={styles.mode}
      testID={`mode-${id}`}
    >
      <View style={styles.tile}>
        <Text variant="title" tone={open ? 'ink' : 'muted'}>
          {glyph}
        </Text>
      </View>

      <View style={styles.lane}>
        <View style={styles.row}>
          <Text>{label}</Text>
          <Text variant="caption" tone={open ? 'accent' : 'muted'}>
            {badgeLine(open, level)}
          </Text>
        </View>
        {/* In a row, so the bar takes the width it is offered rather than the height. */}
        <View style={styles.bar}>
          <ProgressBar share={progressOf(open, level)} weight="thin" />
        </View>
      </View>
    </Pressable>
  );
}

const DISC = 48;
const TILE = 44;

const styles = StyleSheet.create((theme) => ({
  modes: { gap: theme.spacing.xs },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  disc: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: DISC / 2,
    height: DISC,
    justifyContent: 'center',
    width: DISC,
  },
  play: { color: theme.colors.surf, marginLeft: 2 },
  mode: {
    alignItems: 'center',
    borderBottomColor: theme.colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.m,
    height: TILE,
    justifyContent: 'center',
    width: TILE,
  },
  lane: { flex: 1, gap: theme.spacing.xs },
  bar: { flexDirection: 'row' },
}));
