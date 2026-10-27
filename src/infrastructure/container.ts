import { Container } from 'inversify';

import { expoAppVersionReader } from '@/infrastructure/expo-app-version-reader';
import { SYMBOLS } from '@/infrastructure/symbols';
import { createGetAppVersion } from '@/usecases/get-app-version';

export function createContainer(): Container {
  const container = new Container();

  container.bind(SYMBOLS.infrastructure.AppVersionReader).toConstantValue(expoAppVersionReader);
  container
    .bind(SYMBOLS.usecases.GetAppVersion)
    .toResolvedValue(createGetAppVersion, [SYMBOLS.infrastructure.AppVersionReader]);

  return container;
}
