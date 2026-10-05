export type RealtimeCallback = () => void | Promise<void>;

const registry = new Map<string, Set<RealtimeCallback>>();

export function addRealtimeListener(
  table: string,
  callback: RealtimeCallback,
) {
  let listeners = registry.get(table);

  if (!listeners) {
    listeners = new Set();
    registry.set(table, listeners);
  }

  listeners.add(callback);

  console.log("[Realtime REGISTER]", {
    table,
    listeners: listeners.size,
    tables: Array.from(registry.keys()),
  });

  return () => {
    listeners?.delete(callback);

    console.log("[Realtime UNREGISTER]", {
      table,
      listeners: listeners?.size ?? 0,
      tables: Array.from(registry.keys()),
    });

    if (listeners && listeners.size === 0) {
      registry.delete(table);
    }
  };
}

export async function dispatchRealtime(table: string) {
  const listeners = registry.get(table);

  console.log("[Realtime dispatch]", {
    table,
    listeners: listeners?.size ?? 0,
    tables: Array.from(registry.keys()),
  });

  if (!listeners) return;

  for (const listener of listeners) {
    try {
      await listener();
    } catch (error) {
      console.error(
        `[Realtime] erro no listener da tabela ${table}`,
        error,
      );
    }
  }
}