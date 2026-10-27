export interface AppVersionReader {
  read(): string;
}

export type GetAppVersion = () => string;

export function createGetAppVersion(reader: AppVersionReader): GetAppVersion {
  return () => reader.read();
}
