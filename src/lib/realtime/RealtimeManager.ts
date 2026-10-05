import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { dispatchRealtime } from "./registry";

class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>();

start() {
  console.log("[Realtime] inicializado");
}

  subscribe(table: string) {
    if (this.channels.has(table)) {
      return;
    }

    const channel = supabase
      .channel(`table:${table}`)
      .on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table,
  },
  async () => {
  console.log("[Realtime EVENT]", table);

  await dispatchRealtime(table);
}
)
      .subscribe((status) => {
        console.log(
          `[Realtime] ${table}:`,
          status,
        );
      });

    this.channels.set(table, channel);
  }

  unsubscribe(table: string) {
    const channel = this.channels.get(table);

    if (!channel) return;

    void supabase.removeChannel(channel);

    this.channels.delete(table);
  }

  stop() {
    for (const channel of this.channels.values()) {
      void supabase.removeChannel(channel);
    }

    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();