import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import { STARTS, STEPS, type Start, suggested } from '@/components/wording/welcome';
import { type Notation, nameOf } from '@/domain/notation/naming';
import type { Level } from '@/domain/training/level';
import { SYMBOLS } from '@/infrastructure/symbols';

/** The note the first step reads, in the clef the first study is in. */
const SHOWN = { degree: 'g', octave: 4 } as const;

const DESK = '/';

/** The listening bars of the first step, in points, and the mark that answers them. */
const LEVELS = [8, 14, 20, 11] as const;
const BARS = 20;
const TICK = '✓';
const TICK_SIZE = 20;

/** The microphone of the last step: a disc on a halo, to the mockup's two sizes. */
const HALO = 140;
const MEDALLION = 84;
const CAPSULE = 14;

/**
 * The introduction, shown once and never again.
 *
 * Three steps, and two ways out of them: through the last one, which asks for
 * the microphone and opens what the learner said they could read, or over the
 * top, which opens nothing and asks for nothing. Both mark the introduction
 * seen — passing it over is still having seen it.
 *
 * Which is why this is not where the microphone is rescued: a learner who went
 * over the top never met the question, and will not meet it here again. The
 * screen a session stops on asks it instead.
 */
export default function WelcomeScreen() {
  const askForMicrophone = useService(SYMBOLS.usecases.AskForMicrophone);
  const finishWelcome = useService(SYMBOLS.usecases.FinishWelcome);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const [notation, setNotation] = useState<Notation>();
  const [step, setStep] = useState(0);
  const [start, setStart] = useState<Level>(suggested);

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  const leave = useCallback(
    async (chosen?: Level) => {
      await finishWelcome(chosen);
      router.replace(DESK);
    },
    [finishWelcome],
  );

  const next = useCallback(async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    await askForMicrophone();
    await leave(start);
  }, [askForMicrophone, leave, start, step]);

  const { title, body, cta } = STEPS[step] as (typeof STEPS)[number];

  return (
    <Screen>
      <View style={styles.head}>
        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)} testID="welcome-back">
            <Text variant="title">‹</Text>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Pressable onPress={() => void leave()} testID="welcome-skip">
          <Text tone="muted">Passer</Text>
        </Pressable>
      </View>

      {/* The picture comes before the words it illustrates, and the question
          after the words that ask it: a list of answers read before the question
          is a list of answers to nothing. */}
      {step === 0 && notation !== undefined && <Read notation={notation} />}
      {step === 2 && <Microphone />}

      <Text variant="display">{title}</Text>
      <Text tone="muted">{body}</Text>

      {step === 1 && <Where chosen={start} onChoose={setStart} />}

      <View style={styles.spacer} />

      <View style={styles.dots}>
        {STEPS.map((shown, index) => (
          <View key={shown.title} style={index === step ? styles.here : styles.dot} />
        ))}
      </View>

      <Button label={cta} onPress={() => void next()} testID="welcome-next" />
    </Screen>
  );
}

/** What an exercise looks like: a note, and the word that answers it, heard. */
function Read({ notation }: { readonly notation: Notation }) {
  return (
    <Card>
      <Staff clef="treble" notes={[{ pitch: SHOWN, shade: 'current' }]} />
      <View style={styles.heard}>
        <View style={styles.levels}>
          {LEVELS.map((level) => (
            <View key={level} style={[styles.level, { height: level }]} />
          ))}
        </View>
        <Text testID="welcome-note" variant="title">
          {`« ${nameOf(SHOWN.degree, notation)} »`}
        </Text>
        <View style={styles.tick}>
          <Text style={styles.ticked} variant="caption">
            {TICK}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/**
 * What the microphone is for, drawn rather than named.
 *
 * Two circles and three rectangles: the shape of a microphone is recognised at
 * this size, and an icon font pulled in for one glyph is a font shipped for one
 * glyph. The accent is spent here because this is the screen that asks for
 * something, and it is the only thing on it being asked about.
 */
function Microphone() {
  return (
    <View style={styles.halo} testID="welcome-microphone">
      <View style={styles.medallion}>
        <View style={styles.capsule} />
        <View style={styles.stem} />
        <View style={styles.foot} />
      </View>
    </View>
  );
}

/** The three places to start from, one of them already offered. */
function Where({
  chosen,
  onChoose,
}: {
  readonly chosen: Level;
  readonly onChoose: (level: Level) => void;
}) {
  return (
    <View style={styles.starts}>
      {STARTS.map((start) => (
        <Pick key={start.level} onChoose={onChoose} picked={start.level === chosen} start={start} />
      ))}
    </View>
  );
}

function Pick({
  onChoose,
  picked,
  start,
}: {
  readonly onChoose: (level: Level) => void;
  readonly picked: boolean;
  readonly start: Start;
}) {
  styles.useVariants({ picked });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: picked }}
      onPress={() => onChoose(start.level)}
      style={styles.pick}
      testID={`start-${start.level}`}
    >
      <Text style={styles.pickTitle}>{start.title}</Text>
      <Text variant="caption" tone="muted">
        {start.detail}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  heard: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  levels: { alignItems: 'center', flexDirection: 'row', gap: 3, height: BARS },
  level: { backgroundColor: theme.colors.accent, borderRadius: 2, width: 3 },
  tick: {
    alignItems: 'center',
    backgroundColor: theme.colors.ok,
    borderRadius: theme.radii.pill,
    height: TICK_SIZE,
    justifyContent: 'center',
    width: TICK_SIZE,
  },
  ticked: { color: theme.colors.bg },
  halo: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.pill,
    height: HALO,
    justifyContent: 'center',
    width: HALO,
  },
  medallion: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: MEDALLION,
    justifyContent: 'center',
    width: MEDALLION,
  },
  capsule: {
    backgroundColor: theme.colors.bg,
    borderRadius: CAPSULE / 2,
    height: CAPSULE * 1.7,
    width: CAPSULE,
  },
  stem: { backgroundColor: theme.colors.bg, height: 7, marginTop: 4, width: 3 },
  foot: { backgroundColor: theme.colors.bg, borderRadius: 2, height: 3, marginTop: 2, width: 20 },
  head: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  spacer: { flex: 1 },
  starts: { gap: theme.spacing.s },
  dots: { alignSelf: 'center', flexDirection: 'row', gap: theme.spacing.xs },
  dot: { backgroundColor: theme.colors.line, borderRadius: 3, height: 6, width: 6 },
  here: { backgroundColor: theme.colors.ink, borderRadius: 3, height: 6, width: 18 },
  pick: {
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.m,
    variants: {
      picked: {
        true: { backgroundColor: theme.colors.soft, borderColor: theme.colors.ink },
        false: { backgroundColor: theme.colors.bg, borderColor: theme.colors.line },
      },
    },
  },
  pickTitle: { fontFamily: theme.typography.family.medium },
}));
