import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * A choice between a handful of options, all of them on screen.
 *
 * The label is optional: a choice whose options say what they are — two clefs —
 * does not need a word above it saying so again.
 *
 * It is not a `Button`: a button asks to be acted on, a choice shows which of
 * several states is the current one. Nothing here is primary.
 *
 * It is drawn as one track with the current option raised out of it, rather than
 * as a row of separate pills: separate pills say "press one of these", a track
 * says "it is set to this one", and only the second is true of a choice.
 */

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

export function Choice<T extends string>({
  label,
  options,
  chosen,
  onChoose,
}: {
  readonly label?: string;
  readonly options: readonly Option<T>[];
  readonly chosen: T | undefined;
  readonly onChoose: (value: T) => void;
}) {
  return (
    <View style={styles.choice}>
      {label !== undefined && (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      )}
      <View style={styles.options}>
        {options.map((option) => (
          <Item
            key={option.value}
            option={option}
            selected={option.value === chosen}
            onChoose={onChoose}
          />
        ))}
      </View>
    </View>
  );
}

function Item<T extends string>({
  option,
  selected,
  onChoose,
}: {
  readonly option: Option<T>;
  readonly selected: boolean;
  readonly onChoose: (value: T) => void;
}) {
  styles.useVariants({ selected });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onChoose(option.value)}
      style={styles.option}
      testID={`choice-${option.value}`}
    >
      <Text style={styles.label}>{option.label}</Text>
    </Pressable>
  );
}

/** The track's own padding, and what the raised option's corner loses to it. */
const LIP = 3;

const styles = StyleSheet.create((theme) => ({
  choice: { gap: theme.spacing.xs },
  options: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.m,
    flexDirection: 'row',
    padding: LIP,
  },
  option: {
    alignItems: 'center',
    borderRadius: theme.radii.m - LIP,
    /** Equal shares: a track whose halves are the width of their words is not a track. */
    flex: 1,
    paddingVertical: theme.spacing.s,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.surf },
        false: {},
      },
    },
  },
  label: {
    fontFamily: theme.typography.family.medium,
    variants: {
      selected: {
        true: { color: theme.colors.ink },
        false: { color: theme.colors.muted },
      },
    },
  },
}));
