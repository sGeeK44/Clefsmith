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

      {step === 0 && notation !== undefined && <Read notation={notation} />}
      {step === 1 && <Where chosen={start} onChoose={setStart} />}

      <Text variant="display">{title}</Text>
      <Text tone="muted">{body}</Text>

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

/** What an exercise looks like: a note, and the word that answers it. */
function Read({ notation }: { readonly notation: Notation }) {
  return (
    <Card>
      <Staff clef="treble" notes={[{ pitch: SHOWN, shade: 'current' }]} />
      <Text testID="welcome-note" variant="title" tone="accent">
        {`« ${nameOf(SHOWN.degree, notation)} »`}
      </Text>
    </Card>
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
