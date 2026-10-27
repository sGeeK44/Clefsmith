import type { Container, ServiceIdentifier } from 'inversify';
import { createContext, type ReactNode, use } from 'react';

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({
  children,
  container,
}: {
  children: ReactNode;
  container: Container;
}) {
  return <ContainerContext value={container}>{children}</ContainerContext>;
}

export function useService<T>(identifier: ServiceIdentifier<T>): T {
  const container = use(ContainerContext);

  if (container === null) {
    throw new Error('useService was called outside of a ContainerProvider.');
  }

  return container.get(identifier);
}
