export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-zinc-500">
        © {new Date().getFullYear()} Skyvan OS — Tüm hakları saklıdır.
      </div>
    </footer>
  );
}