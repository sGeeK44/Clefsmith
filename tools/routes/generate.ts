/**
 * The typed-route declarations, written without a development server.
 *
 * `typedRoutes` is what makes `router.push` reject a path that is not a route,
 * and the declarations it checks against are generated into `.expo/`, which is
 * not committed. Nothing in the chain produced them, so the CI typechecked
 * against no routes at all and passed on code that does not compile.
 *
 * Expo writes them from the development server and from an export; neither is
 * something a verification run should have to start. This reaches the two
 * pieces underneath instead — the route context, and the generator — and writes
 * the file itself.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const APP = resolve(import.meta.dir, '../../src/app');
const OUT = resolve(import.meta.dir, '../../.expo/types');

/** Read when `expo-router/internal/testing` builds the context, so it is set first. */
process.env.EXPO_ROUTER_APP_ROOT = APP;

const here = createRequire(import.meta.url);

const { requireContext } = here('expo-router/internal/testing');
const { EXPO_ROUTER_CTX_IGNORE } = here('expo-router/_ctx-shared');

/**
 * The generator is `expo-router`'s own, resolved **through** it rather than as
 * a dependency of this repository. `@expo/router-server` is versioned apart —
 * 58.0.17 against expo-router's 58.0.26 as this is written — so declaring it
 * here would pin a second copy free to drift from the router that has to agree
 * with it. What is wanted is whichever copy the router resolves, always.
 */
const throughRouter = createRequire(here.resolve('expo-router/package.json'));
const { getTypedRoutesDeclarationFile } = throughRouter(
  '@expo/router-server/build/typed-routes/generate',
);

const declarations = getTypedRoutesDeclarationFile(
  requireContext(APP, true, EXPO_ROUTER_CTX_IGNORE),
  {},
);

if (!declarations) {
  throw new Error('expo-router produced no route declarations');
}

mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'router.d.ts'), declarations);
