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
 * several states is the current one. That is why the selected option is the one
 * that carries the accent, and why nothing here is primary.
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

const styles = StyleSheet.create((theme) => ({
  choice: { gap: theme.spacing.xs },
  options: { flexDirection: 'row', gap: theme.spacing.s },
  option: {
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.soft, borderColor: theme.colors.accent },
        false: { backgroundColor: theme.colors.bg, borderColor: theme.colors.line },
      },
    },
  },
  label: {
    fontFamily: theme.typography.family.medium,
    variants: {
      selected: {
        true: { color: theme.colors.accent },
        false: { color: theme.colors.muted },
      },
    },
  },
}));
