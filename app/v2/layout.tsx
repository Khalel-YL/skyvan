import type { ReactNode } from "react";

import { ThemeProvider } from "@/app/(public)/components/ThemeProvider";

export default function V2Layout({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
