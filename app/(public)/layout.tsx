import type { ReactNode } from "react";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>
      </main>

      <Footer />
    </div>
  );
}