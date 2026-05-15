import type { ReactNode } from "react";
import { PanelShell } from "@/components/panel-shell";

export default function AppPanelLayout({ children }: { children: ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
