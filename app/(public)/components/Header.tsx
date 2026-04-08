import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight transition hover:opacity-80"
        >
          Skyvan OS
        </Link>

        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          <Link href="/pages/hakkimizda" className="transition hover:text-white">
            Hakkımızda
          </Link>
        </nav>
      </div>
    </header>
  );
}