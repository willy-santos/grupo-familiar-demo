import { useEffect, type ReactNode } from "react";
import { realtimeManager } from "./RealtimeManager";

interface RealtimeProviderProps {
  children: ReactNode;
}

const realtimeTables = [
  "profiles",
  "user_roles",
  "members",
  "events",
  "notifications",
  "reports",
  "grupos",
  "lessons",
  "offerings",
];
export function RealtimeProvider({
  children,
}: RealtimeProviderProps) {
  useEffect(() => {
    realtimeManager.start();

    realtimeTables.forEach((table) => {
      realtimeManager.subscribe(table);
    });

    return () => {
      realtimeManager.stop();
    };
  }, []);

  return <>{children}</>;
}