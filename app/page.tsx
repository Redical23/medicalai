import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
          MediVue
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          AI-Powered Health Analysis
        </p>
        <Link
          href="/face-detect"
          className="flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          🩺 Start Health Analysis
        </Link>
      </main>
    </div>
  );
}
