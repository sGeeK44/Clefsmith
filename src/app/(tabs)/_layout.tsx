import { Tabs } from 'expo-router/js-tabs';
import { type ColorValue, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

/**
 * The three tabs, and the only screens that show them.
 *
 * They are a route group inside the root stack rather than the stack itself, so
 * every screen pushed on top of them — a session, an exercise, a report — hides
 * them without any screen having to ask.
 *
 * The bar is the router's own: it already knows the safe area, the active route
 * and the platform's gestures. Only its colours and its glyphs are ours, which
 * is why the theme is read here and handed over as options rather than styled
 * in place.
 */

/** The side of a tab glyph, and the corner that tells the two squares apart from the circle. */
const GLYPH = 22;
const CORNER = 7;
export default function TabsLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontFamily: theme.typography.family.medium },
        tabBarStyle: { backgroundColor: theme.colors.surf, borderTopColor: theme.colors.line },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pupitre',
          tabBarButtonTestID: 'tab-desk',
          tabBarIcon: ({ color }) => <Glyph color={color} round={false} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progrès',
          tabBarButtonTestID: 'tab-progress',
          tabBarIcon: ({ color }) => <Glyph color={color} round={false} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarButtonTestID: 'tab-settings',
          tabBarIcon: ({ color }) => <Glyph color={color} round />,
        }}
      />
    </Tabs>
  );
}

/**
 * What a tab is drawn as: a rounded square, or a circle for the last one.
 *
 * Two shapes rather than three pictograms. Nothing in the application is a
 * picture of a desk or of progress, and an icon font brought in to draw one
 * would be a dependency carrying hundreds of glyphs for the sake of two. The
 * shapes are what the mockup draws, and the colour is the bar's own — it is
 * handed to the icon so that the active tab and its label never disagree.
 */
function Glyph({ color, round }: { readonly color: ColorValue; readonly round: boolean }) {
  return (
    <View
      style={{
        backgroundColor: color,
        borderRadius: round ? GLYPH / 2 : CORNER,
        height: GLYPH,
        width: GLYPH,
      }}
    />
  );
}
