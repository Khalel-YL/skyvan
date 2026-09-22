import { ThemeProvider } from "./(public)/components/ThemeProvider";
import { PublicNotFoundPage } from "./(public)/components/PublicNotFoundPage";

export default function RootNotFound() {
  return (
    <ThemeProvider>
      <PublicNotFoundPage forcedLocale="tr" />
    </ThemeProvider>
  );
}
