import type { ReactNode } from "react";
import { AppFrame } from "@/components/comic/AppFrame";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
