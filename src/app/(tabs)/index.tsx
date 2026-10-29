import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Card } from '@/components/ui/card';
import { Flash } from '@/components/ui/flash';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { STUDIES, tempoOf } from '@/components/wording/study';
import { nameOf } from '@/domain/notation/naming';
import type { Pitch } from '@/domain/notation/pitch';
import { type Level, newcomersOf } from '@/domain/training/level';
import { SYMBOLS } from '@/infrastructure/symbols';

/**
 * The desk: where the learner is, and what they can do about it.
 *
 * Only the treble clef is on it. The bass clef has a progression of its own, and
 * no screen of CLE-14 shows it — a desk that showed both would be asking the
 * learner to pick a clef before they have read a note.
 */
const PARCOURS = '/studies';

/** In the mockup's order. The last two have nothing behind them yet. */
const MODES = [
  { label: 'Lecture de notes', open: true },
  { label: 'Lecture rythmée', open: true },
  { label: 'Rythme seul', open: false },
  { label: 'Dictée musicale', open: false },
] as const;

export default function DeskScreen() {
  const getProgress = useService(SYMBOLS.usecases.GetProgress);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [level, setLevel] = useState<Level>();
  const [names, setNames] = useState<(pitch: Pitch) => string>();
  const [coming, setComing] = useState<string>();

  useEffect(() => {
    getProgress().then((progress) => setLevel(progress.level.treble));
  }, [getProgress]);

  useEffect(() => {
    getSettings().then(({ notation }) => setNames(() => (pitch: Pitch) => nameOf(pitch, notation)));
  }, [getSettings]);

  const forget = useCallback(() => setComing(undefined), []);

  return (
    <Screen>
      <Text variant="display">Mon pupitre</Text>

      {level !== undefined && names !== undefined && <Current level={level} names={names} />}

      <View style={styles.modes}>
        {MODES.map((mode) => (
          <Mode
            key={mode.label}
            label={mode.label}
            level={level}
            onClosed={setComing}
            open={mode.open}
          />
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
function Current({
  level,
  names,
}: {
  readonly level: Level;
  readonly names: (pitch: Pitch) => string;
}) {
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
        <Text variant="caption" tone="muted">
          {subtitle(level, brought, names)}
        </Text>
      </Card>
    </Pressable>
  );
}

/**
 * `Étude 4 · Fa, Sol`, or just `Étude 6` at the level that brings nothing.
 *
 * The notes are named through the learner's own notation, which is the first
 * place that setting shows on a screen.
 */
function subtitle(
  level: Level,
  brought: readonly Pitch[],
  names: (pitch: Pitch) => string,
): string {
  const study = `Étude ${level}`;

  return brought.length === 0
    ? study
    : `${study} · ${brought.map(names).map(capitalised).join(', ')}`;
}

function capitalised(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function Mode({
  label,
  level,
  open,
  onClosed,
}: {
  readonly label: string;
  readonly level: Level | undefined;
  readonly open: boolean;
  readonly onClosed: (message: string) => void;
}) {
  return (
    <Pressable
      onPress={() => (open ? router.push(PARCOURS) : onClosed(`${label} arrive bientôt`))}
      style={styles.mode}
      testID={`mode-${label}`}
    >
      <Text>{label}</Text>
      <Text variant="caption" tone={open ? 'accent' : 'muted'}>
        {open ? `${level ?? 1} / ${STUDIES}` : 'Bientôt'}
      </Text>
    </Pressable>
  );
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
