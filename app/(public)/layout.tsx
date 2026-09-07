import "./public-launch.css";
import type { ReactNode } from "react";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { ThemeProvider } from "./components/ThemeProvider";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="public-main" tabIndex={-1} className="flex-1">{children}</main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
