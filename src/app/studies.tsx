import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { exerciseRoute } from '@/components/exercise-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Choice, type Option } from '@/components/ui/choice';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { modeOf } from '@/components/wording/mode';
import { lengthLine, measuresLine, tempoLine } from '@/components/wording/session';
import {
  broughtLine,
  clefName,
  nodeLabel,
  reachLine,
  studyLine,
  tempoOf,
} from '@/components/wording/study';
import { CLEFS, type Clef } from '@/domain/notation/clef';
import type { Notation } from '@/domain/notation/naming';
import { LEVELS, type Level, poolOf } from '@/domain/training/level';
import { type Progress, type Reach, reachOf } from '@/domain/training/progress';
import {
  defaultSessionSettings,
  faster,
  MEASURES,
  type Measures,
  type SessionSettings,
  slower,
} from '@/domain/training/session-settings';
import { SYMBOLS } from '@/infrastructure/symbols';

const PICK_CLEF: readonly Option<Clef>[] = CLEFS.map((clef) => ({
  value: clef,
  label: clefName(clef),
}));

/** `Choice` chooses between words; the four lengths travel as their own digits. */
const PICK_MEASURES: readonly Option<`${Measures}`>[] = MEASURES.map((measures) => ({
  value: `${measures}`,
  label: `${measures}`,
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
  /**
   * The exercise the learner came in through decides whether time is beaten —
   * that is the only thing telling the two readings apart. It is a starting
   * point and not a lock: the switch is still there, inside the study.
   */
  const mode = modeOf(useLocalSearchParams<{ mode?: string }>().mode);
  const [session, setSession] = useState<SessionSettings>(() => ({
    ...defaultSessionSettings(),
    metronome: mode.timed,
  }));

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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="studies-back">
          <Text variant="display" tone="muted">
            ‹
          </Text>
        </Pressable>
        <Text variant="title">{mode.label}</Text>
      </View>

      {read && (
        <>
          <Choice options={PICK_CLEF} chosen={clef} onChoose={pickClef} />

          <SessionPanel onChange={setSession} session={session} />

          <ScrollView contentContainerStyle={styles.ladder}>
            {/* One rail behind the six nodes rather than a segment per study: a
                segment per study breaks where the open card pushes them apart. */}
            <View style={styles.rail} />
            {LEVELS.map((level) => (
              <Study
                key={level}
                chosen={level === chosen}
                clef={clef}
                level={level}
                notation={notation}
                onChoose={setChosen}
                session={session}
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
  session,
}: {
  readonly chosen: boolean;
  readonly clef: Clef;
  readonly level: Level;
  readonly notation: Notation;
  readonly onChoose: (level: Level) => void;
  readonly reach: Reach;
  readonly session: SessionSettings;
}) {
  const ahead = reach === 'ahead';
  styles.useVariants({ reach });

  return (
    <View style={styles.study}>
      <Pressable
        disabled={ahead}
        onPress={() => onChoose(level)}
        style={styles.head}
        testID={`study-${level}`}
      >
        <View style={styles.node}>
          <Text style={styles.number}>{nodeLabel(reach, level)}</Text>
        </View>
        <Text style={styles.name} variant="title" tone={ahead ? 'muted' : 'ink'}>
          {tempoOf(level)}
        </Text>
        <Text variant="caption" tone={reach === 'current' ? 'accent' : 'muted'}>
          {reachLine(reach)}
        </Text>
      </Pressable>

      {chosen && !ahead && <Open clef={clef} level={level} notation={notation} session={session} />}
    </View>
  );
}

/** What the chosen study holds, and the way into it. */
function Open({
  clef,
  level,
  notation,
  session,
}: {
  readonly clef: Clef;
  readonly level: Level;
  readonly notation: Notation;
  readonly session: SessionSettings;
}) {
  const { tempo, measures, metronome } = session;
  const readMicrophoneAccess = useService(SYMBOLS.usecases.ReadMicrophoneAccess);

  const start = useCallback(async () => {
    const setup = { clef, level: `${level}`, tempo: `${tempo}`, measures: `${measures}` };

    router.push(
      exerciseRoute(await readMicrophoneAccess(), { ...setup, metronome: String(metronome) }),
    );
  }, [clef, level, readMicrophoneAccess, measures, metronome, tempo]);

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

      <Button label="Commencer" onPress={() => void start()} testID="start" />
    </Card>
  );
}

const NODE = 36;
const RAIL = 2;

const styles = StyleSheet.create((theme) => ({
  header: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  ladder: { gap: theme.spacing.s, paddingBottom: theme.spacing.l },
  rail: {
    backgroundColor: theme.colors.line,
    bottom: NODE / 2,
    left: (NODE - RAIL) / 2,
    position: 'absolute',
    top: NODE / 2,
    width: RAIL,
  },
  study: { gap: theme.spacing.xs },
  head: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  node: {
    alignItems: 'center',
    borderRadius: NODE / 2,
    borderWidth: 1.5,
    height: NODE,
    justifyContent: 'center',
    width: NODE,
    variants: {
      reach: {
        done: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
        current: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
        /** The one node drawn hollow: nothing is behind it yet, and it does not answer. */
        ahead: {
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.line,
          borderStyle: 'dashed',
        },
      },
    },
  },
  number: {
    variants: {
      reach: {
        done: { color: theme.colors.surf },
        current: { color: theme.colors.surf },
        ahead: { color: theme.colors.muted },
      },
    },
  },
  /** The name takes the slack, so the meta is pinned to the right edge. */
  name: { flex: 1 },
  marks: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.m },
  panel: { gap: theme.spacing.xs },
}));

/**
 * What this session is to be played with, folded away until it is wanted.
 *
 * Folded, it still says the two numbers that change the session most, so the
 * learner never has to open it to find out what they are about to play.
 */
function SessionPanel({
  onChange,
  session,
}: {
  readonly onChange: (session: SessionSettings) => void;
  readonly session: SessionSettings;
}) {
  const [open, setOpen] = useState(false);
  const { tempo, measures, metronome } = session;

  return (
    <View style={styles.panel}>
      <Pressable onPress={() => setOpen(!open)} style={styles.marks} testID="session-settings">
        <Text>Réglages de séance</Text>
        <Text variant="caption" tone="muted">
          {`${tempoLine(tempo)} · ${measuresLine(measures)}`}
        </Text>
      </Pressable>

      {open && (
        <Card>
          <View style={styles.marks}>
            <Text>Tempo</Text>
            <Button
              emphasis="quiet"
              label="−"
              onPress={() => onChange({ ...session, tempo: slower(tempo) })}
              testID="tempo-slower"
            />
            <Text testID="tempo">{tempoLine(tempo)}</Text>
            <Button
              emphasis="quiet"
              label="+"
              onPress={() => onChange({ ...session, tempo: faster(tempo) })}
              testID="tempo-faster"
            />
          </View>

          <Choice
            chosen={`${measures}`}
            label="Mesures"
            onChoose={(picked) => onChange({ ...session, measures: Number(picked) as Measures })}
            options={PICK_MEASURES}
          />
          <Text testID="session-length" tone="muted" variant="caption">
            {lengthLine(measures)}
          </Text>

          <Toggle
            label="Métronome"
            on={metronome}
            onToggle={(on) => onChange({ ...session, metronome: on })}
            testID="metronome"
          />
        </Card>
      )}
    </View>
  );
}
