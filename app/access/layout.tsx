import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Gateway",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccessLayout({ children }: { children: ReactNode }) {
  return children;
}
